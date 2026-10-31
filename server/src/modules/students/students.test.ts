// Students and Academic Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import type { Express } from 'express';

describe('Students and Academic Management Suite', () => {
  let app: Express;
  let adminAgent: ReturnType<typeof request.agent>;
  let batchId: string;

  beforeAll(async () => {
    app = buildApp({ skipRateLimit: true });
    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({ identifier: 'admin', password: 'DemoPassword123!' });

    const bRes = await adminAgent.get('/api/academic/batches');
    batchId = bRes.body.data[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('paginates student lists with proper bounds and metadata', async () => {
    const res = await adminAgent.get('/api/students?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta).toHaveProperty('page', 1);
    expect(res.body.meta).toHaveProperty('limit', 2);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('searches students by name or enrollment number', async () => {
    const res = await adminAgent.get('/api/students?search=Aarav');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].display_name).toContain('Aarav');
  });

  it('previews CSV import separating valid from invalid rows', async () => {
    const mockCsv = `enrollment_no,display_name,current_semester,phone
24BCA101,Rohan Mehta,1,9876543210
,Missing Name User,1,9876543211
24BCA102,,1,9876543212`;

    const res = await adminAgent
      .post('/api/students/import-preview')
      .set('X-Requested-With', 'erp')
      .send({ csv: mockCsv, batchId });

    expect(res.status).toBe(200);
    expect(res.body.data.validRows.length).toBe(1);
    expect(res.body.data.invalidRows.length).toBe(2);
    expect(res.body.data.validRows[0].enrollment_no).toBe('24BCA101');
  });

  it('deactivates student without deleting record (deactivate-not-delete)', async () => {
    // 1. Create temporary student
    const createRes = await adminAgent
      .post('/api/students')
      .set('X-Requested-With', 'erp')
      .send({
        enrollmentNo: '24BCATEMP01',
        displayName: 'Temp Deactivate Test',
        batchId,
        currentSemester: 1,
      });
    expect(createRes.status).toBe(201);
    const studentId = createRes.body.data.id;

    // 2. Deactivate
    const deactRes = await adminAgent
      .patch(`/api/students/${studentId}/deactivate`)
      .set('X-Requested-With', 'erp');
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.data.is_active).toBe(false);

    // 3. Verify record still exists in database
    const verifyRes = await adminAgent.get(`/api/students/${studentId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.is_active).toBe(false);
  });

  it('rolls back student user and profile completely on creation failure', async () => {
    const initialUserCount = parseInt(
      (await pool.query("SELECT count(*) FROM erp.users WHERE identifier = 'FAIL_ROLLBACK_01'")).rows[0].count,
      10
    );
    expect(initialUserCount).toBe(0);

    // Provide invalid batchId UUID that fails foreign key
    const res = await adminAgent
      .post('/api/students')
      .set('X-Requested-With', 'erp')
      .send({
        enrollmentNo: 'FAIL_ROLLBACK_01',
        displayName: 'Fail Rollback',
        batchId: '00000000-0000-0000-0000-000000000000', // Nonexistent batch
        currentSemester: 1,
      });

    expect(res.status).toBe(409); // Foreign key conflict

    // Verify user was NOT left behind
    const afterUserCount = parseInt(
      (await pool.query("SELECT count(*) FROM erp.users WHERE identifier = 'FAIL_ROLLBACK_01'")).rows[0].count,
      10
    );
    expect(afterUserCount).toBe(0);
  });
});
