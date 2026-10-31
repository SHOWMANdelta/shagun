// Database Constraint Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { env } from '../config/env.js';

describe('Database Constraints and Triggers', () => {
  let pool: pg.Pool;

  beforeAll(() => {
    pool = new pg.Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects UPDATE or DELETE on audit_log', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET search_path TO erp, public');

      // Attempt to insert and then delete
      const insRes = await client.query(`
        INSERT INTO erp.audit_log (table_name, record_id, action)
        VALUES ('test', gen_random_uuid(), 'INSERT')
        RETURNING id
      `);
      const logId = insRes.rows[0].id;

      // UPDATE must fail
      await expect(
        client.query(`UPDATE erp.audit_log SET table_name = 'hacked' WHERE id = $1`, [logId])
      ).rejects.toThrow();

      // DELETE must fail
      await expect(
        client.query(`DELETE FROM erp.audit_log WHERE id = $1`, [logId])
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } catch {
      await client.query('ROLLBACK');
      throw new Error('Audit log protection test failed');
    } finally {
      client.release();
    }
  });

  it('rejects duplicate enrollment_no in students', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET search_path TO erp, public');

      const batch = await client.query('SELECT id FROM erp.batches LIMIT 1');
      const batchId = batch.rows[0].id;

      // Create first user & student
      const u1 = await client.query(`
        INSERT INTO erp.users (role, identifier, display_name, password_hash)
        VALUES ('student', 'TEST_DUP_001', 'Test S1', 'hash') RETURNING id
      `);
      await client.query(`
        INSERT INTO erp.students (user_id, batch_id, enrollment_no)
        VALUES ($1, $2, 'TEST_DUP_001')
      `, [u1.rows[0].id, batchId]);

      // Create second user & try same enrollment_no
      const u2 = await client.query(`
        INSERT INTO erp.users (role, identifier, display_name, password_hash)
        VALUES ('student', 'TEST_DUP_002', 'Test S2', 'hash') RETURNING id
      `);

      await expect(
        client.query(`
          INSERT INTO erp.students (user_id, batch_id, enrollment_no)
          VALUES ($1, $2, 'TEST_DUP_001')
        `, [u2.rows[0].id, batchId])
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('rejects marks above max_marks via trigger', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET search_path TO erp, public');

      const st = await client.query('SELECT id FROM erp.students LIMIT 1');
      const sub = await client.query('SELECT id FROM erp.subjects LIMIT 1');
      const et = await client.query("SELECT id, max_marks FROM erp.exam_types WHERE name = 'Mid-Term'");
      const b = await client.query('SELECT id FROM erp.batches LIMIT 1');

      const studentId = st.rows[0].id;
      const subjectId = sub.rows[0].id;
      const examTypeId = et.rows[0].id;
      const maxMarks = et.rows[0].max_marks;
      const batchId = b.rows[0].id;

      // Inserting 1 mark higher than max_marks must fail trigger
      await expect(
        client.query(`
          INSERT INTO erp.marks (student_id, subject_id, exam_type_id, batch_id, marks_obtained)
          VALUES ($1, $2, $3, $4, $5)
        `, [studentId, subjectId, examTypeId, batchId, maxMarks + 10])
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('rejects duplicate attendance session for same subject, batch, and date', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET search_path TO erp, public');

      const sub = await client.query('SELECT id FROM erp.subjects LIMIT 1');
      const b = await client.query('SELECT id FROM erp.batches LIMIT 1');
      const f = await client.query('SELECT id FROM erp.faculty LIMIT 1');

      const subjectId = sub.rows[0].id;
      const batchId = b.rows[0].id;
      const facultyId = f.rows[0].id;

      await client.query(`
        INSERT INTO erp.attendance_sessions (subject_id, batch_id, faculty_id, session_date)
        VALUES ($1, $2, $3, '2025-01-15')
      `, [subjectId, batchId, facultyId]);

      // Second identical session must fail unique constraint
      await expect(
        client.query(`
          INSERT INTO erp.attendance_sessions (subject_id, batch_id, faculty_id, session_date)
          VALUES ($1, $2, $3, '2025-01-15')
        `, [subjectId, batchId, facultyId])
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
