// Notices Module Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import type { Express } from 'express';

describe('Notices Module Suite', () => {
  let app: Express;
  let adminAgent: ReturnType<typeof request.agent>;
  let studentAgent: ReturnType<typeof request.agent>;

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
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates and lists active notices with unread state', async () => {
    // 1. Create notice as admin
    const createRes = await adminAgent
      .post('/api/notices')
      .set('X-Requested-With', 'erp')
      .send({
        title: 'Mid-Term Exam Schedule Announced',
        body: 'Exams will commence from November 15, 2026. Please check your subject syllabus.',
        target: 'all',
        isPinned: true,
      });
    expect(createRes.status).toBe(201);
    const noticeId = createRes.body.data.id;

    // 2. Student views notice list (notice must be unread initially)
    const listRes = await studentAgent.get('/api/notices');
    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((n: { id: string }) => n.id === noticeId);
    expect(found).toBeDefined();
    expect(found.is_read).toBe(false);

    // 3. Student marks notice as read
    const readRes = await studentAgent
      .post(`/api/notices/${noticeId}/read`)
      .set('X-Requested-With', 'erp');
    expect(readRes.status).toBe(200);

    // 4. Verify notice is now marked read for this student
    const updatedList = await studentAgent.get('/api/notices');
    const updatedNotice = updatedList.body.data.find((n: { id: string }) => n.id === noticeId);
    expect(updatedNotice.is_read).toBe(true);
  });

  it('filters expired notices from listing', async () => {
    // Insert expired notice directly
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const expNotice = await pool.query(
      `INSERT INTO erp.notices (title, body, target, expires_at, created_by)
       VALUES ('Expired Circular', 'Old details', 'all', $1, (SELECT id FROM erp.users WHERE identifier = 'admin'))
       RETURNING id`,
      [pastDate.toISOString()]
    );
    const expId = expNotice.rows[0].id;

    const listRes = await studentAgent.get('/api/notices');
    const found = listRes.body.data.find((n: { id: string }) => n.id === expId);
    expect(found).toBeUndefined(); // Must not appear
  });
});
