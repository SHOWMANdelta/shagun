// Marks and Results Module Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import type { Express } from 'express';

describe('Marks and Results Suite', () => {
  let app: Express;
  let adminAgent: ReturnType<typeof request.agent>;
  let studentAgent: ReturnType<typeof request.agent>;
  let batchId: string;
  let subjectId: string;
  let examTypeId: string;
  let studentId: string;

  beforeAll(async () => {
    app = buildApp({ skipRateLimit: true });

    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({ identifier: 'admin', password: 'DemoPassword123!' });

    studentAgent = request.agent(app);
    await studentAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({ identifier: '24BCA001', password: 'DemoPassword123!' });

    const bRes = await adminAgent.get('/api/academic/batches');
    batchId = bRes.body.data[0].id;

    const sRes = await adminAgent.get('/api/academic/subjects');
    subjectId = sRes.body.data[0].id;

    const etRes = await adminAgent.get('/api/marks/exam-types');
    examTypeId = etRes.body.data[0].id;

    const stRes = await adminAgent.get('/api/students?search=24BCA001');
    studentId = stRes.body.data[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects marks above max_marks allowed for exam type', async () => {
    const res = await adminAgent
      .post('/api/marks/bulk')
      .set('X-Requested-With', 'erp')
      .send({
        entries: [
          {
            studentId,
            subjectId,
            examTypeId,
            batchId,
            marksObtained: 999, // Exceeds max_marks (30 for Mid-Term)
          },
        ],
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('saves marks as unpublished; students cannot see unpublished marks', async () => {
    // 1. Enter valid marks as faculty/admin
    const bulkRes = await adminAgent
      .post('/api/marks/bulk')
      .set('X-Requested-With', 'erp')
      .send({
        entries: [
          {
            studentId,
            subjectId,
            examTypeId,
            batchId,
            marksObtained: 25.5,
          },
        ],
      });
    expect(bulkRes.status).toBe(200);

    // 2. Student views marks - should NOT see unpublished marks
    const studentRes = await studentAgent.get('/api/marks');
    expect(studentRes.status).toBe(200);
    const unpublishedMark = studentRes.body.data.find(
      (m: { subject_id: string; exam_type_id: string }) =>
        m.subject_id === subjectId && m.exam_type_id === examTypeId
    );
    expect(unpublishedMark).toBeUndefined();
  });

  it('publishes marks; student can now view published marks and SGPA', async () => {
    // 1. Publish marks
    const pubRes = await adminAgent
      .post('/api/marks/publish')
      .set('X-Requested-With', 'erp')
      .send({ subjectId, examTypeId, batchId });
    expect(pubRes.status).toBe(200);

    // 2. Student views marks - now visible
    const studentRes = await studentAgent.get('/api/marks');
    expect(studentRes.status).toBe(200);
    const publishedMark = studentRes.body.data.find(
      (m: { subject_id: string; exam_type_id: string }) =>
        m.subject_id === subjectId && m.exam_type_id === examTypeId
    );
    expect(publishedMark).toBeDefined();
    expect(publishedMark.marks_obtained).toBe(25.5);
    expect(publishedMark.is_published).toBe(true);

    // 3. Student views SGPA
    const sgpaRes = await studentAgent.get('/api/marks/sgpa');
    expect(sgpaRes.status).toBe(200);
    expect(sgpaRes.body.data.length).toBeGreaterThan(0);
    expect(sgpaRes.body.data[0]).toHaveProperty('sgpa');
    expect(typeof sgpaRes.body.data[0].sgpa).toBe('number');
  });
});
