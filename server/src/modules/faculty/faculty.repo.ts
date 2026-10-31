import { query } from '../../db/pool.js';
import { pool } from '../../db/pool.js';

export interface FacultyRow {
  id: string;
  user_id: string;
  employee_code: string;
  display_name: string;
  department: string | null;
  designation: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export async function listFaculty(params: {
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ rows: FacultyRow[]; total: number }> {
  const values: unknown[] = [];
  let where = '1=1';
  if (params.search) {
    where += ` AND (u.display_name ILIKE $1 OR f.employee_code ILIKE $1)`;
    values.push(`%${params.search}%`);
  }

  const countRes = await query(
    `SELECT COUNT(*) FROM erp.faculty f JOIN erp.users u ON u.id = f.user_id WHERE ${where}`,
    values
  );
  const total = parseInt(String((countRes.rows[0] as { count: string }).count), 10);

  values.push(params.limit, params.offset);
  const pi = values.length;
  const dataRes = await query<FacultyRow>(
    `SELECT f.id, f.user_id, f.employee_code, u.display_name,
            f.department, f.designation, f.phone, u.is_active, f.created_at
     FROM erp.faculty f
     JOIN erp.users u ON u.id = f.user_id
     WHERE ${where}
     ORDER BY f.employee_code ASC
     LIMIT $${pi - 1} OFFSET $${pi}`,
    values
  );
  return { rows: dataRes.rows, total };
}

export async function getFacultyById(id: string): Promise<FacultyRow | null> {
  const res = await query<FacultyRow>(
    `SELECT f.id, f.user_id, f.employee_code, u.display_name,
            f.department, f.designation, f.phone, u.is_active, f.created_at
     FROM erp.faculty f
     JOIN erp.users u ON u.id = f.user_id
     WHERE f.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function getFacultyByUserId(userId: string): Promise<FacultyRow | null> {
  const res = await query<FacultyRow>(
    `SELECT f.id, f.user_id, f.employee_code, u.display_name,
            f.department, f.designation, f.phone, u.is_active, f.created_at
     FROM erp.faculty f
     JOIN erp.users u ON u.id = f.user_id
     WHERE f.user_id = $1`,
    [userId]
  );
  return res.rows[0] ?? null;
}

export async function createFaculty(params: {
  employeeCode: string;
  displayName: string;
  department?: string;
  designation?: string;
  phone?: string;
  passwordHash: string;
}): Promise<FacultyRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO erp, public`);

    const uRes = await client.query(
      `INSERT INTO erp.users (role, identifier, display_name, password_hash)
       VALUES ('faculty', $1, $2, $3) RETURNING id`,
      [params.employeeCode, params.displayName, params.passwordHash]
    );
    const userId = uRes.rows[0].id;

    const fRes = await client.query(
      `INSERT INTO erp.faculty (user_id, employee_code, department, designation, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, params.employeeCode, params.department ?? null,
       params.designation ?? null, params.phone ?? null]
    );
    await client.query('COMMIT');
    return (await getFacultyById(fRes.rows[0].id))!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateFaculty(
  id: string,
  params: {
    displayName?: string;
    department?: string;
    designation?: string;
    phone?: string;
    isActive?: boolean;
  }
): Promise<FacultyRow | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path TO erp, public`);

    const fRes = await client.query(
      'SELECT user_id FROM erp.faculty WHERE id = $1', [id]
    );
    if (!fRes.rows[0]) { await client.query('ROLLBACK'); return null; }
    const userId = fRes.rows[0].user_id;

    await client.query(
      `UPDATE erp.users
       SET display_name = COALESCE($1, display_name),
           is_active = COALESCE($2, is_active)
       WHERE id = $3`,
      [params.displayName ?? null, params.isActive ?? null, userId]
    );
    await client.query(
      `UPDATE erp.faculty
       SET department = COALESCE($1, department),
           designation = COALESCE($2, designation),
           phone = COALESCE($3, phone)
       WHERE id = $4`,
      [params.department ?? null, params.designation ?? null, params.phone ?? null, id]
    );
    await client.query('COMMIT');
    return getFacultyById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getFacultyAssignments(facultyId: string) {
  const res = await query(
    `SELECT fs.id, fs.subject_id, sub.code AS subject_code, sub.name AS subject_name,
            sub.semester, fs.batch_id, b.name AS batch_name, fs.academic_year
     FROM erp.faculty_subjects fs
     JOIN erp.subjects sub ON sub.id = fs.subject_id
     JOIN erp.batches b ON b.id = fs.batch_id
     WHERE fs.faculty_id = $1
     ORDER BY sub.semester, sub.name`,
    [facultyId]
  );
  return res.rows;
}
