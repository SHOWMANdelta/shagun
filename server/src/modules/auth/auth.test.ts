// Auth and RBAC Test Suite
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import type { Express } from 'express';

describe('Authentication and RBAC Suite', () => {
  let app: Express;
  let adminAgent: ReturnType<typeof request.agent>;
  let facultyAgent: ReturnType<typeof request.agent>;
  let studentAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = buildApp({ skipRateLimit: true });

    // Pre-authenticate role agents for matrix testing
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

    studentAgent = request.agent(app);
    await studentAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({ identifier: '24BCA001', password: 'DemoPassword123!' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects login with invalid credentials with generic error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({
        identifier: 'nonexistent_user',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('successfully logs in admin and sets session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({
        identifier: 'admin',
        password: 'DemoPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.identifier).toBe('admin');
    expect(res.body.data.role).toBe('admin');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/erp\.sid/);
    expect(cookies[0]).toMatch(/HttpOnly/i);
    expect(cookies[0]).toMatch(/SameSite=Lax/i);
  });

  it('blocks unauthenticated access to /api/auth/me with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows authenticated session to access /api/auth/me', async () => {
    const meRes = await adminAgent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.identifier).toBe('admin');
  });

  it('logs out and destroys session', async () => {
    const tempAgent = request.agent(app);
    await tempAgent
      .post('/api/auth/login')
      .set('X-Requested-With', 'erp')
      .send({
        identifier: 'admin',
        password: 'DemoPassword123!',
      });

    const logoutRes = await tempAgent
      .post('/api/auth/logout')
      .set('X-Requested-With', 'erp');
    expect(logoutRes.status).toBe(200);

    // Subsequent access must fail
    const meRes = await tempAgent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });

  // Table-driven RBAC matrix testing across roles
  describe('RBAC Route Matrix', () => {
    interface MatrixItem {
      method: 'get' | 'post';
      route: string;
      expectedAnon: number;
      expectedStudent: number;
      expectedFaculty: number;
      expectedAdmin: number;
    }

    const rbacMatrix: MatrixItem[] = [
      { method: 'get', route: '/api/auth/me', expectedAnon: 401, expectedStudent: 200, expectedFaculty: 200, expectedAdmin: 200 },
      { method: 'get', route: '/api/academic/programs', expectedAnon: 401, expectedStudent: 200, expectedFaculty: 200, expectedAdmin: 200 },
      { method: 'get', route: '/api/academic/batches', expectedAnon: 401, expectedStudent: 200, expectedFaculty: 200, expectedAdmin: 200 },
      { method: 'get', route: '/api/academic/subjects', expectedAnon: 401, expectedStudent: 200, expectedFaculty: 200, expectedAdmin: 200 },
      { method: 'get', route: '/api/academic/assignments', expectedAnon: 401, expectedStudent: 403, expectedFaculty: 403, expectedAdmin: 200 },
      { method: 'get', route: '/api/students', expectedAnon: 401, expectedStudent: 403, expectedFaculty: 200, expectedAdmin: 200 },
      { method: 'get', route: '/api/students/me', expectedAnon: 401, expectedStudent: 200, expectedFaculty: 403, expectedAdmin: 403 },
      { method: 'get', route: '/api/faculty/me', expectedAnon: 401, expectedStudent: 403, expectedFaculty: 200, expectedAdmin: 403 },
      { method: 'get', route: '/api/notices', expectedAnon: 401, expectedStudent: 200, expectedFaculty: 200, expectedAdmin: 200 },
    ];

    for (const item of rbacMatrix) {
      it(`evaluates ${item.method.toUpperCase()} ${item.route} across RBAC matrix`, async () => {
        // 1. Anonymous
        const anonRes = await request(app)[item.method](item.route);
        expect(anonRes.status).toBe(item.expectedAnon);

        // 2. Student
        const studentRes = await studentAgent[item.method](item.route);
        expect(studentRes.status).toBe(item.expectedStudent);

        // 3. Faculty
        const facultyRes = await facultyAgent[item.method](item.route);
        expect(facultyRes.status).toBe(item.expectedFaculty);

        // 4. Admin
        const adminRes = await adminAgent[item.method](item.route);
        expect(adminRes.status).toBe(item.expectedAdmin);
      });
    }
  });
});
