// Deterministic seed - Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DATABASE_URL = process.env.DATABASE_URL!;
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'DemoPassword123!';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO erp, public");
    await client.query('BEGIN');

    process.stdout.write('\n🌱 Seeding database...\n');

    // Hash password (bcrypt cost 12)
    const hash = await bcrypt.hash(SEED_PASSWORD, 12);

    // ---- ADMIN ----
    const adminRes = await client.query(`
      INSERT INTO erp.users (role, identifier, display_name, password_hash)
      VALUES ('admin', 'admin', 'System Administrator', $1)
      ON CONFLICT (identifier) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
    `, [hash]);
    const adminId = adminRes.rows[0].id;
    process.stdout.write(`  ✅ Admin user (identifier: "admin")\n`);

    // ---- PROGRAM ----
    const programRes = await client.query(`
      INSERT INTO erp.programs (code, name, total_semesters)
      VALUES ('BCA', 'Bachelor of Computer Applications', 6)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const programId = programRes.rows[0].id;
    process.stdout.write(`  ✅ Program: BCA\n`);

    // ---- BATCH ----
    const batchRes = await client.query(`
      INSERT INTO erp.batches (program_id, name, start_year, end_year)
      VALUES ($1, 'BCA-2024-2027', 2024, 2027)
      ON CONFLICT (program_id, name) DO UPDATE SET start_year = EXCLUDED.start_year
      RETURNING id
    `, [programId]);
    const batchId = batchRes.rows[0].id;
    process.stdout.write(`  ✅ Batch: BCA-2024-2027\n`);

    // ---- SUBJECTS ----
    const subjects = [
      { code: 'BCA101', name: 'Problem Solving Using C', semester: 1, credits: 4.0 },
      { code: 'BCA102', name: 'Mathematics-I', semester: 1, credits: 3.0 },
      { code: 'BCA103', name: 'Digital Computer Organization', semester: 1, credits: 3.0 },
      { code: 'BCA201', name: 'Data Structures', semester: 2, credits: 4.0 },
      { code: 'BCA202', name: 'Object Oriented Programming (Java)', semester: 2, credits: 4.0 },
      { code: 'BCA301', name: 'Database Management Systems', semester: 3, credits: 4.0 },
      { code: 'BCA302', name: 'Operating Systems', semester: 3, credits: 3.0 },
    ];
    const subjectIds: Record<string, string> = {};
    for (const s of subjects) {
      const r = await client.query(`
        INSERT INTO erp.subjects (program_id, code, name, semester, credits)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [programId, s.code, s.name, s.semester, s.credits]);
      subjectIds[s.code] = r.rows[0].id;
    }
    process.stdout.write(`  ✅ Subjects (${subjects.length})\n`);

    // ---- EXAM TYPES ----
    const examTypes = [
      { name: 'Mid-Term', max_marks: 30, weight_pct: 30 },
      { name: 'End-Term', max_marks: 70, weight_pct: 70 },
    ];
    const examTypeIds: Record<string, string> = {};
    for (const et of examTypes) {
      const r = await client.query(`
        INSERT INTO erp.exam_types (name, max_marks, weight_pct)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET max_marks = EXCLUDED.max_marks
        RETURNING id
      `, [et.name, et.max_marks, et.weight_pct]);
      examTypeIds[et.name] = r.rows[0].id;
    }
    process.stdout.write(`  ✅ Exam types (${examTypes.length})\n`);

    // ---- FACULTY ----
    const facultyData = [
      { code: 'FAC001', name: 'Dr. Priya Sharma' },
      { code: 'FAC002', name: 'Prof. Rajan Mehta' },
    ];
    const facultyIds: Record<string, string> = {};
    for (const f of facultyData) {
      const uRes = await client.query(`
        INSERT INTO erp.users (role, identifier, display_name, password_hash)
        VALUES ('faculty', $1, $2, $3)
        ON CONFLICT (identifier) DO UPDATE SET display_name = EXCLUDED.display_name
        RETURNING id
      `, [f.code, f.name, hash]);
      const uId = uRes.rows[0].id;

      const fRes = await client.query(`
        INSERT INTO erp.faculty (user_id, employee_code, department, designation)
        VALUES ($1, $2, 'Computer Science', 'Assistant Professor')
        ON CONFLICT (employee_code) DO UPDATE SET department = EXCLUDED.department
        RETURNING id
      `, [uId, f.code]);
      facultyIds[f.code] = fRes.rows[0].id;
    }
    process.stdout.write(`  ✅ Faculty (${facultyData.length})\n`);

    // ---- FACULTY SUBJECT ASSIGNMENTS ----
    const assignments = [
      { faculty: 'FAC001', subject: 'BCA101' },
      { faculty: 'FAC001', subject: 'BCA201' },
      { faculty: 'FAC002', subject: 'BCA301' },
      { faculty: 'FAC002', subject: 'BCA302' },
    ];
    for (const a of assignments) {
      await client.query(`
        INSERT INTO erp.faculty_subjects (faculty_id, subject_id, batch_id, academic_year)
        VALUES ($1, $2, $3, '2024-25')
        ON CONFLICT (faculty_id, subject_id, batch_id, academic_year) DO NOTHING
      `, [facultyIds[a.faculty], subjectIds[a.subject], batchId]);
    }
    process.stdout.write(`  ✅ Faculty-subject assignments (${assignments.length})\n`);

    // ---- STUDENTS ----
    const studentsData = [
      { enrollment: '24BCA001', name: 'Aarav Patel', semester: 1 },
      { enrollment: '24BCA002', name: 'Diya Singh', semester: 1 },
      { enrollment: '24BCA003', name: 'Karan Verma', semester: 1 },
    ];
    const studentIds: Record<string, string> = {};
    for (const s of studentsData) {
      const uRes = await client.query(`
        INSERT INTO erp.users (role, identifier, display_name, password_hash)
        VALUES ('student', $1, $2, $3)
        ON CONFLICT (identifier) DO UPDATE SET display_name = EXCLUDED.display_name
        RETURNING id
      `, [s.enrollment, s.name, hash]);
      const uId = uRes.rows[0].id;

      const stRes = await client.query(`
        INSERT INTO erp.students (user_id, batch_id, enrollment_no, current_semester)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (enrollment_no) DO UPDATE SET current_semester = EXCLUDED.current_semester
        RETURNING id
      `, [uId, batchId, s.enrollment, s.semester]);
      studentIds[s.enrollment] = stRes.rows[0].id;
    }
    process.stdout.write(`  ✅ Students (${studentsData.length})\n`);

    // ---- NOTICE ----
    await client.query(`
      INSERT INTO erp.notices (title, body, target, is_pinned, created_by)
      VALUES (
        'Welcome to Mini College ERP',
        'This system is now live. Please explore your dashboard and contact admin for any issues.',
        'all',
        TRUE,
        $1
      )
      ON CONFLICT DO NOTHING
    `, [adminId]);
    process.stdout.write(`  ✅ Welcome notice\n`);

    await client.query('COMMIT');
    process.stdout.write('\n✅ Seed complete!\n');
    process.stdout.write('\nDemo Credentials (password for all: ' + SEED_PASSWORD + '):\n');
    process.stdout.write('  Admin:   identifier="admin"\n');
    process.stdout.write('  Faculty: identifier="FAC001" or "FAC002"\n');
    process.stdout.write('  Student: identifier="24BCA001", "24BCA002", or "24BCA003"\n\n');

  } catch (err) {
    await client.query('ROLLBACK');
    process.stderr.write(`\n❌ Seed failed: ${(err as Error).message}\n`);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
