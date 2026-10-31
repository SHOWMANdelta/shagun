// Database Verification Script
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DATABASE_URL = process.env.DATABASE_URL!;
const DB_SCHEMA = process.env.DB_SCHEMA || 'erp';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verify() {
  const client = await pool.connect();
  try {
    process.stdout.write(`\n🔍 Verifying Database Schema and Integrity for schema "${DB_SCHEMA}"...\n\n`);

    // 1. Verify schema exists
    const schemaRes = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [DB_SCHEMA]
    );
    if (schemaRes.rows.length === 0) {
      throw new Error(`Schema ${DB_SCHEMA} does not exist`);
    }
    process.stdout.write(`  ✅ Schema exists: ${DB_SCHEMA}\n`);

    // 2. Verify expected tables
    const expectedTables = [
      'audit_log',
      'users',
      'session',
      'programs',
      'batches',
      'subjects',
      'students',
      'faculty',
      'faculty_subjects',
      'attendance_sessions',
      'attendance',
      'exam_types',
      'marks',
      'notices',
      'notice_reads',
    ];

    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
      [DB_SCHEMA]
    );
    const existingTables = new Set(tablesRes.rows.map((r: { table_name: string }) => r.table_name));

    for (const table of expectedTables) {
      if (!existingTables.has(table)) {
        throw new Error(`Missing expected table: ${table}`);
      }
    }
    process.stdout.write(`  ✅ All ${expectedTables.length} expected tables exist\n`);

    // 3. Verify views
    const viewsRes = await client.query(
      `SELECT table_name FROM information_schema.views WHERE table_schema = $1`,
      [DB_SCHEMA]
    );
    const existingViews = new Set(viewsRes.rows.map((r: { table_name: string }) => r.table_name));
    const expectedViews = ['v_attendance_summary', 'v_sgpa'];
    for (const view of expectedViews) {
      if (!existingViews.has(view)) {
        throw new Error(`Missing expected view: ${view}`);
      }
    }
    process.stdout.write(`  ✅ Expected views exist: ${expectedViews.join(', ')}\n`);

    // 4. Verify seed row counts
    const userCount = parseInt((await pool.query(`SELECT count(*) FROM "${DB_SCHEMA}".users`)).rows[0].count, 10);
    const progCount = parseInt((await pool.query(`SELECT count(*) FROM "${DB_SCHEMA}".programs`)).rows[0].count, 10);
    const batchCount = parseInt((await pool.query(`SELECT count(*) FROM "${DB_SCHEMA}".batches`)).rows[0].count, 10);
    const subCount = parseInt((await pool.query(`SELECT count(*) FROM "${DB_SCHEMA}".subjects`)).rows[0].count, 10);
    const studentCount = parseInt((await pool.query(`SELECT count(*) FROM "${DB_SCHEMA}".students`)).rows[0].count, 10);
    const facultyCount = parseInt((await pool.query(`SELECT count(*) FROM "${DB_SCHEMA}".faculty`)).rows[0].count, 10);

    process.stdout.write(`  📊 Seed Counts:\n`);
    process.stdout.write(`     - Users: ${userCount}\n`);
    process.stdout.write(`     - Programs: ${progCount}\n`);
    process.stdout.write(`     - Batches: ${batchCount}\n`);
    process.stdout.write(`     - Subjects: ${subCount}\n`);
    process.stdout.write(`     - Students: ${studentCount}\n`);
    process.stdout.write(`     - Faculty: ${facultyCount}\n`);

    if (userCount === 0 || studentCount === 0 || facultyCount === 0) {
      throw new Error('Seed data missing or incomplete');
    }

    // 5. Verify integrity checks
    // Check student-user relationship
    const orphanedStudents = await client.query(`
      SELECT count(*) FROM "${DB_SCHEMA}".students s
      LEFT JOIN "${DB_SCHEMA}".users u ON u.id = s.user_id
      WHERE u.id IS NULL
    `);
    if (parseInt(orphanedStudents.rows[0].count, 10) > 0) {
      throw new Error('Foreign key integrity violation: orphaned students found');
    }

    // Check faculty-user relationship
    const orphanedFaculty = await client.query(`
      SELECT count(*) FROM "${DB_SCHEMA}".faculty f
      LEFT JOIN "${DB_SCHEMA}".users u ON u.id = f.user_id
      WHERE u.id IS NULL
    `);
    if (parseInt(orphanedFaculty.rows[0].count, 10) > 0) {
      throw new Error('Foreign key integrity violation: orphaned faculty found');
    }

    process.stdout.write(`  ✅ Foreign key relationships and integrity verified\n`);
    process.stdout.write(`\n🎉 Phase 2 Database Verification PASSED!\n\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch((err) => {
  process.stderr.write(`\n❌ Database verification failed: ${err.message}\n`);
  process.exit(1);
});
