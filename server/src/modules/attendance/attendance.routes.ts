import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import { getTodayIST, daysBetweenIST } from '../../utils/istDate.js';

export const attendanceRouter = Router();

/** Roster edit window in days (matches /api/settings.attendanceEditWindowDays). */
const EDIT_WINDOW_DAYS = 7;

const sessionBodySchema = z.object({
  subjectId: z.string().uuid(),
  batchId: z.string().uuid(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topic: z.string().max(200).optional(),
});

const attendanceBulkSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late']),
    remarks: z.string().max(200).optional(),
  })).min(1),
});

const summaryQuerySchema = z.object({
  batchId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
});

// GET /api/attendance/sessions
attendanceRouter.get('/sessions', requireRole('admin', 'faculty', 'student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as {
        subjectId?: string; batchId?: string;
        from?: string; to?: string;
      };
      const conditions: string[] = ['1=1'];
      const values: unknown[] = [];
      let i = 1;
      if (q.subjectId) { conditions.push(`sess.subject_id = $${i++}`); values.push(q.subjectId); }
      if (q.batchId)   { conditions.push(`sess.batch_id = $${i++}`);   values.push(q.batchId); }
      if (q.from)      { conditions.push(`sess.session_date >= $${i++}`); values.push(q.from); }
      if (q.to)        { conditions.push(`sess.session_date <= $${i++}`); values.push(q.to); }

      // Faculty sees only their sessions
      if (req.session.role === 'faculty') {
        const fRes = await query(
          'SELECT id FROM erp.faculty WHERE user_id = $1', [req.session.userId]
        );
        if (fRes.rows[0]) {
          conditions.push(`sess.faculty_id = $${i++}`);
          values.push((fRes.rows[0] as { id: string }).id);
        }
      }

      const r = await query(
        `SELECT sess.id, sess.subject_id, sub.name AS subject_name, sub.code AS subject_code,
                sess.batch_id, b.name AS batch_name, sess.faculty_id,
                u.display_name AS faculty_name, sess.session_date,
                sess.topic, sess.is_locked, sess.created_at
         FROM erp.attendance_sessions sess
         JOIN erp.subjects sub ON sub.id = sess.subject_id
         JOIN erp.batches b ON b.id = sess.batch_id
         JOIN erp.faculty f ON f.id = sess.faculty_id
         JOIN erp.users u ON u.id = f.user_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY sess.session_date DESC`,
        values
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// POST /api/attendance/sessions
attendanceRouter.post('/sessions', requireRole('admin', 'faculty'),
  validate({ body: sessionBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const b = req.body;
      // Prevent future dates
      const today = getTodayIST();
      if (b.sessionDate > today) {
        throw new AppError('Session date cannot be in the future', 400, 'INVALID_DATE');
      }
      // Get faculty id
      let facultyId: string;
      if (req.session.role === 'admin') {
        const fRes = await query('SELECT id FROM erp.faculty LIMIT 1');
        facultyId = (fRes.rows[0] as { id: string }).id;
      } else {
        const fRes = await query(
          'SELECT id FROM erp.faculty WHERE user_id = $1', [req.session.userId]
        );
        if (!fRes.rows[0]) throw new AppError('Faculty profile not found', 404, 'NOT_FOUND');
        facultyId = (fRes.rows[0] as { id: string }).id;
      }

      const r = await query(
        `INSERT INTO erp.attendance_sessions (subject_id, batch_id, faculty_id, session_date, topic)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [b.subjectId, b.batchId, facultyId, b.sessionDate, b.topic ?? null]
      );
      res.status(201).json({ data: { id: r.rows[0].id }, meta: {} });
    } catch (e) { next(e); }
  }
);

// GET /api/attendance/sessions/:sessionId/records
attendanceRouter.get('/sessions/:sessionId/records', requireRole('admin', 'faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = await query(
        `SELECT a.id, a.student_id, u.display_name AS student_name,
                st.enrollment_no, a.status, a.remarks, a.marked_at
         FROM erp.attendance a
         JOIN erp.students st ON st.id = a.student_id
         JOIN erp.users u ON u.id = st.user_id
         WHERE a.session_id = $1
         ORDER BY st.enrollment_no`,
        [req.params.sessionId]
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// POST /api/attendance/bulk  - atomic bulk save
attendanceRouter.post('/bulk', requireRole('admin', 'faculty'),
  validate({ body: attendanceBulkSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, records } = req.body;

      // Verify session exists and is not locked
      const sessRes = await query(
        'SELECT id, is_locked, session_date FROM erp.attendance_sessions WHERE id = $1',
        [sessionId]
      );
      if (!sessRes.rows[0]) throw new AppError('Session not found', 404, 'NOT_FOUND');
      const sess = sessRes.rows[0] as { is_locked: boolean; session_date: string };
      if (sess.is_locked) throw new AppError('Session is locked and cannot be edited', 400, 'SESSION_LOCKED');

      // Edit window rule (Phase 5): faculty may edit rosters only within 7 days of the session date.
      // Admins are exempt so institutional corrections remain possible.
      if (req.session.role !== 'admin') {
        const ageDays = daysBetweenIST(sess.session_date, getTodayIST());
        if (ageDays > EDIT_WINDOW_DAYS) {
          throw new AppError(
            `Roster editing closed ${EDIT_WINDOW_DAYS} days after the session date`,
            400,
            'EDIT_WINDOW_CLOSED'
          );
        }
      }

      // Get faculty id (for marked_by)
      let facultyId: string | null = null;
      if (req.session.role === 'faculty') {
        const fRes = await query(
          'SELECT id FROM erp.faculty WHERE user_id = $1', [req.session.userId]
        );
        if (fRes.rows[0]) facultyId = (fRes.rows[0] as { id: string }).id;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SET search_path TO erp, public`);
        for (const rec of records) {
          await client.query(
            `INSERT INTO erp.attendance (session_id, student_id, status, remarks, marked_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (session_id, student_id)
             DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks,
                           marked_by = EXCLUDED.marked_by, marked_at = now()`,
            [sessionId, rec.studentId, rec.status, rec.remarks ?? null, facultyId]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      res.json({ data: { saved: records.length }, meta: {} });
    } catch (e) { next(e); }
  }
);

// GET /api/attendance/summary
attendanceRouter.get('/summary', requireRole('admin', 'faculty', 'student'),
  validate({ query: summaryQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as {
        batchId?: string; subjectId?: string; studentId?: string
      };
      const conditions: string[] = ['1=1'];
      const values: unknown[] = [];
      let i = 1;

      // Students always scoped to their own data
      if (req.session.role === 'student') {
        const stRes = await query(
          'SELECT id FROM erp.students WHERE user_id = $1', [req.session.userId]
        );
        if (!stRes.rows[0]) throw new AppError('Student not found', 404, 'NOT_FOUND');
        conditions.push(`v.student_id = $${i++}`);
        values.push((stRes.rows[0] as { id: string }).id);
      } else if (q.studentId) {
        conditions.push(`v.student_id = $${i++}`);
        values.push(q.studentId);
      }
      if (q.batchId)   { conditions.push(`v.batch_id = $${i++}`);   values.push(q.batchId); }
      if (q.subjectId) { conditions.push(`v.subject_id = $${i++}`); values.push(q.subjectId); }

      const r = await query(
        `SELECT v.student_id, u.display_name AS student_name, st.enrollment_no,
                v.subject_id, sub.name AS subject_name, sub.code AS subject_code,
                sub.semester, v.total_sessions, v.present_count,
                v.late_count, v.absent_count, v.attendance_pct
         FROM erp.v_attendance_summary v
         JOIN erp.students st ON st.id = v.student_id
         JOIN erp.users u ON u.id = st.user_id
         JOIN erp.subjects sub ON sub.id = v.subject_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY st.enrollment_no, sub.semester, sub.code`,
        values
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);


