import { query } from '../../db/pool.js';
import { pool } from '../../db/pool.js';

export interface StudentRow {
  id: string;
  user_id: string;
  enrollment_no: string;
  display_name: string;
  batch_id: string;
  batch_name: string;
  program_name: string;
  current_semester: number;
  dob: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export async function listStudents(params: {
  batchId?: string;
  semester?: number;
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ rows: StudentRow[]; total: number }> {
  const conditions: string[] = ['1=1'];
  const values: unknown[] = [];
  let idx = 1;

  if (params.batchId) {
    conditions.push(`st.batch_id = $${idx++}`);
    values.push(params.batchId);
  }
  if (params.semester) {
    conditions.push(`st.current_semester = $${idx++}`);
    values.push(params.semester);
  }
  if (params.search) {
    conditions.push(`(u.display_name ILIKE $${idx} OR st.enrollment_no ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');

  const countRes = await query(
    `SELECT COUNT(*) FROM erp.students st
     JOIN erp.users u ON u.id = st.user_id
     WHERE ${where}`,
    values
  );
  const total = parseInt(String((countRes.rows[0] as { count: string }).count), 10);

  values.push(params.limit, params.offset);
  const dataRes = await query<StudentRow>(
    `SELECT st.id, st.user_id, st.enrollment_no, u.display_name,
            st.batch_id, b.name AS batch_name, p.name AS program_name,
            st.current_semester, st.dob, st.phone, st.address,
            u.is_active, st.created_at
     FROM erp.students st
     JOIN erp.users u ON u.id = st.user_id
     JOIN erp.batches b ON b.id = st.batch_id
     JOIN erp.programs p ON p.id = b.program_id
     WHERE ${where}
     ORDER BY st.enrollment_no ASC
     LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return { rows: dataRes.rows, total };
}

export async function getStudentById(id: string): Promise<StudentRow | null> {
  const res = await query<StudentRow>(
    `SELECT st.id, st.user_id, st.enrollment_no, u.display_name,
            st.batch_id, b.name AS batch_name, p.name AS program_name,
            st.current_semester, st.dob, st.phone, st.address,
            u.is_active, st.created_at
     FROM erp.students st
     JOIN erp.users u ON u.id = st.user_id
     JOIN erp.batches b ON b.id = st.batch_id
     JOIN erp.programs p ON p.id = b.program_id
     WHERE st.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function getStudentByUserId(userId: string): Promise<StudentRow | null> {
  const res = await query<StudentRow>(
    `SELECT st.id, st.user_id, st.enrollment_no, u.display_name,
            st.batch_id, b.name AS batch_name, p.name AS program_name,
            st.current_semester, st.dob, st.phone, st.address,
            u.is_active, st.created_at
     FROM erp.students st
     JOIN erp.users u ON u.id = st.user_id
     JOIN erp.batches b ON b.id = st.batch_id
     JOIN erp.programs p ON p.id = b.program_id
     WHERE st.user_id = $1`,
    [userId]
  );
  return res.rows[0] ?? null;
}

export async function createStudent(params: {
  enrollmentNo: string;
  displayName: string;
  batchId: string;
  currentSemester: number;
  dob?: string;
  phone?: string;
  address?: string;
  passwordHash: string;
}): Promise<StudentRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO erp, public`);

    const uRes = await client.query(
      `INSERT INTO erp.users (role, identifier, display_name, password_hash)
       VALUES ('student', $1, $2, $3) RETURNING id`,
      [params.enrollmentNo, params.displayName, params.passwordHash]
    );
    const userId = uRes.rows[0].id;

    const stRes = await client.query(
      `INSERT INTO erp.students
         (user_id, batch_id, enrollment_no, current_semester, dob, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, params.batchId, params.enrollmentNo, params.currentSemester,
       params.dob ?? null, params.phone ?? null, params.address ?? null]
    );
    const studentId = stRes.rows[0].id;

    await client.query('COMMIT');
    const row = await getStudentById(studentId);
    return row!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateStudent(
  id: string,
  params: {
    displayName?: string;
    currentSemester?: number;
    dob?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
  }
): Promise<StudentRow | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO erp, public`);

    const stRes = await client.query(
      'SELECT user_id FROM erp.students WHERE id = $1',
      [id]
    );
    if (!stRes.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    const userId = stRes.rows[0].user_id;

    if (params.displayName !== undefined || params.isActive !== undefined) {
      await client.query(
        `UPDATE erp.users
         SET display_name = COALESCE($1, display_name),
             is_active = COALESCE($2, is_active)
         WHERE id = $3`,
        [params.displayName ?? null, params.isActive ?? null, userId]
      );
    }

    await client.query(
      `UPDATE erp.students
       SET current_semester = COALESCE($1, current_semester),
           dob = COALESCE($2, dob),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address)
       WHERE id = $5`,
      [params.currentSemester ?? null, params.dob ?? null,
       params.phone ?? null, params.address ?? null, id]
    );

    await client.query('COMMIT');
    return getStudentById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
