import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { query } from '../../db/pool.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', requireRole('admin', 'faculty', 'student'), async (_req, res) => {
  res.json({
    data: {
      collegeName: 'Mini College',
      universityName: 'Mini College University',
      studentName: 'Shagun Kaushal',
      projectTitle: 'Mini College ERP System',
      projectNo: 41,
      course: 'BCA (6 semesters)',
      session: '2026-27',
      attendanceThreshold: 75,
      passPercent: 40,
      attendanceEditWindowDays: 7,
    },
    meta: {},
  });
});

// GET /api/settings/audit
settingsRouter.get('/audit', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await query(
      `SELECT id, table_name, record_id, action, changed_at, new_data
       FROM erp.audit_log
       ORDER BY changed_at DESC
       LIMIT 50`
    );
    res.json({ data: r.rows, meta: { total: r.rowCount } });
  } catch (err) { next(err); }
});
