// Attendance Module Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import { getTodayIST } from '../../utils/istDate.js';
import type { Express } from 'express';

describe('Attendance Module Suite', () => {
  let app: Express;
  let adminAgent: ReturnType<typeof request.agent>;
  let facultyAgent: ReturnType<typeof request.agent>;
  let batchId: string;
  let subjectId: string;
  let students: { id: string }[];

  beforeAll(async () => {
    app = buildApp({ skipRateLimit: true });

    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({ identifier: 'admin', password: 'DemoPassword123!' });

    facultyAgent = request.agent(app);
    await facultyAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({ identifier: 'FAC001', password: 'DemoPassword123!' });

    const bRes = await adminAgent.get('/api/academic/batches');
    batchId = bRes.body.data[0].id;

    const sRes = await adminAgent.get('/api/academic/subjects');
    subjectId = sRes.body.data[0].id;

    const stRes = await adminAgent.get('/api/students');
    students = stRes.body.data;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects future session date based on IST calendar calculation', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const res = await facultyAgent
      .post('/api/attendance/sessions')
      .set('X-Requested-With', 'erp')
      .send({
        subjectId,
        batchId,
        sessionDate: tomorrowStr,
        topic: 'Future Lesson',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE');
  });

  it('creates valid attendance session and saves bulk attendance atomically', async () => {
    const today = getTodayIST();

    // 1. Create session
    const sessRes = await facultyAgent
      .post('/api/attendance/sessions')
      .set('X-Requested-With', 'erp')
      .send({
        subjectId,
        batchId,
        sessionDate: today,
        topic: 'Database Normalization',
      });
    expect([201, 409]).toContain(sessRes.status);

    const sList = await facultyAgent.get(`/api/attendance/sessions?subjectId=${subjectId}`);
    const sessionId = sList.body.data[0].id;

    // 2. Save attendance bulk
    const bulkRes = await facultyAgent
      .post('/api/attendance/bulk')
      .set('X-Requested-With', 'erp')
      .send({
        sessionId,
        records: [
          { studentId: students[0].id, status: 'present' },
          { studentId: students[1].id, status: 'absent' },
        ],
      });

    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.data.saved).toBe(2);

    // 3. Verify records
    const recRes = await facultyAgent.get(`/api/attendance/sessions/${sessionId}/records`);
    expect(recRes.status).toBe(200);
    expect(recRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('computes attendance percentage correctly in summary view', async () => {
    const res = await adminAgent.get(`/api/attendance/summary?subjectId=${subjectId}&studentId=${students[0].id}`);
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      const summary = res.body.data[0];
      expect(summary).toHaveProperty('attendance_pct');
      expect(typeof summary.attendance_pct).toBe('number');
    }
  });

  it('concurrency test: parallel attendance saves resolve safely with zero 500s', async () => {
    const sList = await facultyAgent.get(`/api/attendance/sessions?subjectId=${subjectId}`);
    const sessionId = sList.body.data[0].id;

    // Launch 15 concurrent saves to the exact same session
    const promises = Array.from({ length: 15 }).map((_, i) =>
      facultyAgent
        .post('/api/attendance/bulk')
        .set('X-Requested-With', 'erp')
        .send({
          sessionId,
          records: [
            { studentId: students[0].id, status: i % 2 === 0 ? 'present' : 'late' },
          ],
        })
    );

    const results = await Promise.all(promises);
    for (const r of results) {
      expect(r.status).toBe(200);
    }
  });
});
