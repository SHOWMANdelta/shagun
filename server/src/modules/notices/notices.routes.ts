import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';

export const noticesRouter = Router();

const createNoticeSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(1).max(5000),
  target: z.enum(['all', 'students', 'faculty', 'batch', 'semester']).default('all'),
  targetBatchId: z.string().uuid().optional(),
  targetSemester: z.number().int().min(1).max(12).optional(),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().max(100).optional(),
  target: z.enum(['all', 'students', 'faculty', 'batch', 'semester']).optional(),
});

// GET /api/notices  — filtered by role and batch
noticesRouter.get('/', requireAuth,
  validate({ query: listQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as { search?: string; target?: string; page: string; limit: string };
      const page = parseInt(q.page || '1');
      const limit = parseInt(q.limit || '20');
      const offset = (page - 1) * limit;

      const conditions: string[] = ['(n.expires_at IS NULL OR n.expires_at > now())'];
      const values: unknown[] = [];
      let i = 1;

      if (q.search) {
        conditions.push(`(n.title ILIKE $${i} OR n.body ILIKE $${i})`);
        values.push(`%${q.search}%`);
        i++;
      }
      if (q.target) { conditions.push(`n.target = $${i++}`); values.push(q.target); }

      const where = conditions.join(' AND ');

      const countRes = await query(`SELECT COUNT(*) FROM erp.notices n WHERE ${where}`, values);
      const total = parseInt(String((countRes.rows[0] as { count: string }).count), 10);

      values.push(limit, offset);
      const r = await query(
        `SELECT n.id, n.title, n.body, n.target, n.target_batch_id,
                n.target_semester, n.is_pinned, n.expires_at,
                n.created_by, u.display_name AS author_name, n.created_at,
                EXISTS(
                  SELECT 1 FROM erp.notice_reads nr
                  WHERE nr.notice_id = n.id AND nr.user_id = $${i}
                ) AS is_read
         FROM erp.notices n
         JOIN erp.users u ON u.id = n.created_by
         WHERE ${where}
         ORDER BY n.is_pinned DESC, n.created_at DESC
         LIMIT $${i + 1} OFFSET $${i + 2}`,
        [...values.slice(0, -2), req.session.userId, limit, offset]
      );
      res.json({ data: r.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e) { next(e); }
  }
);

// GET /api/notices/:id
noticesRouter.get('/:id', requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = await query(
        `SELECT n.id, n.title, n.body, n.target, n.target_batch_id,
                n.target_semester, n.is_pinned, n.expires_at,
                n.created_by, u.display_name AS author_name, n.created_at
         FROM erp.notices n
         JOIN erp.users u ON u.id = n.created_by
         WHERE n.id = $1`,
        [req.params.id]
      );
      if (!r.rows[0]) return next(new AppError('Notice not found', 404, 'NOT_FOUND'));
      res.json({ data: r.rows[0], meta: {} });
    } catch (e) { next(e); }
  }
);

// POST /api/notices
noticesRouter.post('/', requireRole('admin', 'faculty'),
  validate({ body: createNoticeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const b = req.body;
      const r = await query(
        `INSERT INTO erp.notices
           (title, body, target, target_batch_id, target_semester, is_pinned, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [b.title, b.body, b.target, b.targetBatchId ?? null, b.targetSemester ?? null,
         b.isPinned, b.expiresAt ?? null, req.session.userId]
      );
      res.status(201).json({ data: { id: r.rows[0].id }, meta: {} });
    } catch (e) { next(e); }
  }
);

// POST /api/notices/:id/read
noticesRouter.post('/:id/read', requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await query(
        `INSERT INTO erp.notice_reads (notice_id, user_id) VALUES ($1, $2)
         ON CONFLICT (notice_id, user_id) DO NOTHING`,
        [req.params.id, req.session.userId]
      );
      res.json({ data: { message: 'Marked as read' }, meta: {} });
    } catch (e) { next(e); }
  }
);

// DELETE /api/notices/:id
noticesRouter.delete('/:id', requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = await query(
        `DELETE FROM erp.notices WHERE id = $1 RETURNING id`, [req.params.id]
      );
      if (!r.rows[0]) return next(new AppError('Notice not found', 404, 'NOT_FOUND'));
      res.json({ data: { message: 'Deleted' }, meta: {} });
    } catch (e) { next(e); }
  }
);


