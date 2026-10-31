import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';

export const marksRouter = Router();

const marksEntrySchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  examTypeId: z.string().uuid(),
  batchId: z.string().uuid(),
  marksObtained: z.number().min(0),
});

const marksBulkSchema = z.object({
  entries: z.array(marksEntrySchema).min(1),
});

const publishSchema = z.object({
  subjectId: z.string().uuid(),
  examTypeId: z.string().uuid(),
  batchId: z.string().uuid(),
});

// GET /api/marks  (Admin/Faculty see all, student sees own published)
marksRouter.get('/', requireRole('admin', 'faculty', 'student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as {
        studentId?: string; subjectId?: string; batchId?: string; examTypeId?: string;
      };
      const conditions: string[] = ['1=1'];
      const values: unknown[] = [];
      let i = 1;

      if (req.session.role === 'student') {
        const stRes = await query(
          'SELECT id FROM erp.students WHERE user_id = $1', [req.session.userId]
        );
        if (!stRes.rows[0]) throw new AppError('Student not found', 404, 'NOT_FOUND');
        conditions.push(`m.student_id = $${i++}`);
        values.push((stRes.rows[0] as { id: string }).id);
        conditions.push(`m.is_published = TRUE`);
      } else {
        if (q.studentId) { conditions.push(`m.student_id = $${i++}`); values.push(q.studentId); }
      }
      if (q.subjectId)  { conditions.push(`m.subject_id = $${i++}`);  values.push(q.subjectId); }
      if (q.batchId)    { conditions.push(`m.batch_id = $${i++}`);    values.push(q.batchId); }
      if (q.examTypeId) { conditions.push(`m.exam_type_id = $${i++}`); values.push(q.examTypeId); }

      const r = await query(
        `SELECT m.id, m.student_id, u.display_name AS student_name, st.enrollment_no,
                m.subject_id, sub.code AS subject_code, sub.name AS subject_name,
                sub.semester, m.exam_type_id, et.name AS exam_type_name, et.max_marks,
                m.marks_obtained, m.is_published, m.entered_at, m.batch_id, b.name AS batch_name
         FROM erp.marks m
         JOIN erp.students st ON st.id = m.student_id
         JOIN erp.users u ON u.id = st.user_id
         JOIN erp.subjects sub ON sub.id = m.subject_id
         JOIN erp.exam_types et ON et.id = m.exam_type_id
         JOIN erp.batches b ON b.id = m.batch_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY st.enrollment_no, sub.semester, sub.code, et.name`,
        values
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// POST /api/marks/bulk
marksRouter.post('/bulk', requireRole('admin', 'faculty'),
  validate({ body: marksBulkSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entries } = req.body;
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
        for (const e of entries) {
          await client.query(
            `INSERT INTO erp.marks
               (student_id, subject_id, exam_type_id, batch_id, marks_obtained, entered_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (student_id, subject_id, exam_type_id, batch_id)
             DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained,
                           entered_by = EXCLUDED.entered_by, updated_at = now()`,
            [e.studentId, e.subjectId, e.examTypeId, e.batchId, e.marksObtained, facultyId]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      res.json({ data: { saved: entries.length }, meta: {} });
    } catch (e) { next(e); }
  }
);

// POST /api/marks/publish  - publish all marks for a subject/exam/batch
marksRouter.post('/publish', requireRole('admin', 'faculty'),
  validate({ body: publishSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subjectId, examTypeId, batchId } = req.body;
      const r = await query(
        `UPDATE erp.marks SET is_published = TRUE
         WHERE subject_id = $1 AND exam_type_id = $2 AND batch_id = $3 AND is_published = FALSE
         RETURNING id`,
        [subjectId, examTypeId, batchId]
      );
      res.json({ data: { published: r.rowCount }, meta: {} });
    } catch (e) { next(e); }
  }
);

// GET /api/marks/sgpa
marksRouter.get('/sgpa', requireRole('admin', 'faculty', 'student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as { studentId?: string; batchId?: string };
      const conditions: string[] = ['1=1'];
      const values: unknown[] = [];
      let i = 1;

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
      if (q.batchId) { conditions.push(`v.batch_id = $${i++}`); values.push(q.batchId); }

      const r = await query(
        `SELECT v.student_id, u.display_name AS student_name, st.enrollment_no,
                v.batch_id, b.name AS batch_name, v.semester, v.sgpa, v.total_credits
         FROM erp.v_sgpa v
         JOIN erp.students st ON st.id = v.student_id
         JOIN erp.users u ON u.id = st.user_id
         JOIN erp.batches b ON b.id = v.batch_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY st.enrollment_no, v.semester`,
        values
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// GET /api/marks/exam-types
marksRouter.get('/exam-types', requireRole('admin', 'faculty', 'student'),
  async (_req, res, next) => {
    try {
      const r = await query(`SELECT id, name, max_marks, weight_pct FROM erp.exam_types ORDER BY name`);
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);


