import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/auth.js';
import { query } from '../../db/pool.js';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../utils/AppError.js';

export const academicRouter = Router();

// --- Programs ---
academicRouter.get('/programs', requireRole('admin', 'faculty', 'student'),
  async (_req, res, next) => {
    try {
      const r = await query(`SELECT id, code, name, total_semesters, is_active FROM erp.programs ORDER BY code`);
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// --- Batches ---
const batchQuerySchema = z.object({
  programId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});
academicRouter.get('/batches', requireRole('admin', 'faculty', 'student'),
  validate({ query: batchQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as { programId?: string; isActive?: string };
      const conditions = ['1=1'];
      const values: unknown[] = [];
      let i = 1;
      if (q.programId) { conditions.push(`b.program_id = $${i++}`); values.push(q.programId); }
      if (q.isActive !== undefined) { conditions.push(`b.is_active = $${i++}`); values.push(q.isActive === 'true'); }
      const r = await query(
        `SELECT b.id, b.name, b.program_id, p.name AS program_name,
                b.start_year, b.end_year, b.is_active
         FROM erp.batches b JOIN erp.programs p ON p.id = b.program_id
         WHERE ${conditions.join(' AND ')} ORDER BY b.start_year DESC`,
        values
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// --- Subjects ---
const subjectQuerySchema = z.object({
  programId: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
});
academicRouter.get('/subjects', requireRole('admin', 'faculty', 'student'),
  validate({ query: subjectQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as { programId?: string; semester?: string };
      const conditions = ['1=1'];
      const values: unknown[] = [];
      let i = 1;
      if (q.programId) { conditions.push(`s.program_id = $${i++}`); values.push(q.programId); }
      if (q.semester) { conditions.push(`s.semester = $${i++}`); values.push(parseInt(q.semester)); }
      const r = await query(
        `SELECT s.id, s.code, s.name, s.semester, s.credits,
                s.program_id, p.name AS program_name, s.is_active
         FROM erp.subjects s JOIN erp.programs p ON p.id = s.program_id
         WHERE ${conditions.join(' AND ')} ORDER BY s.semester, s.code`,
        values
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

// --- Faculty Subject Assignments ---
const assignBodySchema = z.object({
  facultyId: z.string().uuid(),
  subjectId: z.string().uuid(),
  batchId: z.string().uuid(),
  academicYear: z.string().min(4).max(10),
});

academicRouter.get('/assignments', requireRole('admin'),
  async (_req, res, next) => {
    try {
      const r = await query(
        `SELECT fs.id, fs.faculty_id, u.display_name AS faculty_name,
                fs.subject_id, sub.code AS subject_code, sub.name AS subject_name,
                sub.semester, fs.batch_id, b.name AS batch_name, fs.academic_year
         FROM erp.faculty_subjects fs
         JOIN erp.faculty f ON f.id = fs.faculty_id
         JOIN erp.users u ON u.id = f.user_id
         JOIN erp.subjects sub ON sub.id = fs.subject_id
         JOIN erp.batches b ON b.id = fs.batch_id
         ORDER BY sub.semester, sub.name`
      );
      res.json({ data: r.rows, meta: {} });
    } catch (e) { next(e); }
  }
);

academicRouter.post('/assignments', requireRole('admin'),
  validate({ body: assignBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const b = req.body;
      const r = await query(
        `INSERT INTO erp.faculty_subjects (faculty_id, subject_id, batch_id, academic_year)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (faculty_id, subject_id, batch_id, academic_year) DO NOTHING
         RETURNING id`,
        [b.facultyId, b.subjectId, b.batchId, b.academicYear]
      );
      if (!r.rows[0]) throw new AppError('Assignment already exists', 409, 'UNIQUE_VIOLATION');
      res.status(201).json({ data: { id: r.rows[0].id }, meta: {} });
    } catch (e) { next(e); }
  }
);

academicRouter.delete('/assignments/:id', requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = await query(`DELETE FROM erp.faculty_subjects WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!r.rows[0]) return next(new AppError('Assignment not found', 404, 'NOT_FOUND'));
      res.json({ data: { message: 'Deleted' }, meta: {} });
    } catch (e) { next(e); }
  }
);


