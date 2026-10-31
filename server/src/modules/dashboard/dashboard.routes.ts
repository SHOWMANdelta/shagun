import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { query } from '../../db/pool.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.session.role;

    if (role === 'admin') {
      const [uCount, sCount, fCount, bCount, subCount, noticesRes, auditRes] = await Promise.all([
        query('SELECT count(*) FROM erp.users'),
        query('SELECT count(*) FROM erp.students'),
        query('SELECT count(*) FROM erp.faculty'),
        query('SELECT count(*) FROM erp.batches'),
        query('SELECT count(*) FROM erp.subjects'),
        query('SELECT id, title, created_at, is_pinned FROM erp.notices ORDER BY is_pinned DESC, created_at DESC LIMIT 5'),
        query('SELECT id, table_name, action, changed_at FROM erp.audit_log ORDER BY changed_at DESC LIMIT 5'),
      ]);

      return res.json({
        data: {
          totalUsers: parseInt(String((uCount.rows[0] as { count: string }).count), 10),
          totalStudents: parseInt(String((sCount.rows[0] as { count: string }).count), 10),
          totalFaculty: parseInt(String((fCount.rows[0] as { count: string }).count), 10),
          totalBatches: parseInt(String((bCount.rows[0] as { count: string }).count), 10),
          totalSubjects: parseInt(String((subCount.rows[0] as { count: string }).count), 10),
          latestNotices: noticesRes.rows,
          recentAudit: auditRes.rows,
        },
        meta: {},
      });
    }

    if (role === 'faculty') {
      const fRes = await query('SELECT id FROM erp.faculty WHERE user_id = $1', [req.session.userId]);
      const facultyId = fRes.rows[0] ? (fRes.rows[0] as { id: string }).id : null;

      const [assignments, sessions] = await Promise.all([
        query(
          `SELECT fs.id, sub.code, sub.name, b.name AS batch_name
           FROM erp.faculty_subjects fs
           JOIN erp.subjects sub ON sub.id = fs.subject_id
           JOIN erp.batches b ON b.id = fs.batch_id
           WHERE fs.faculty_id = $1`,
          [facultyId]
        ),
        query(
          `SELECT count(*) FROM erp.attendance_sessions WHERE faculty_id = $1`,
          [facultyId]
        ),
      ]);

      return res.json({
        data: {
          totalAssignments: assignments.rows.length,
          totalSessionsMarked: parseInt(String((sessions.rows[0] as { count: string }).count), 10),
          assignments: assignments.rows,
        },
        meta: {},
      });
    }

    if (role === 'student') {
      const stRes = await query('SELECT id FROM erp.students WHERE user_id = $1', [req.session.userId]);
      const studentId = stRes.rows[0] ? (stRes.rows[0] as { id: string }).id : null;

      const [attendanceRes, sgpaRes] = await Promise.all([
        query(
          `SELECT sub.code, sub.name, v.attendance_pct, v.total_sessions, v.present_count
           FROM erp.v_attendance_summary v
           JOIN erp.subjects sub ON sub.id = v.subject_id
           WHERE v.student_id = $1`,
          [studentId]
        ),
        query(
          `SELECT semester, sgpa, total_credits FROM erp.v_sgpa WHERE student_id = $1`,
          [studentId]
        ),
      ]);

      return res.json({
        data: {
          attendance: attendanceRes.rows,
          sgpa: sgpaRes.rows,
        },
        meta: {},
      });
    }

    res.json({ data: {}, meta: {} });
  } catch (err) { next(err); }
});
