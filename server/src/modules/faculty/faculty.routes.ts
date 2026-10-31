import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validate } from '../../middleware/validate.js';
import { requireRole } from '../../middleware/auth.js';
import { z } from 'zod';
import * as repo from './faculty.repo.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

export const facultyRouter = Router();

const createFacultySchema = z.object({
  employeeCode: z.string().min(1).max(30),
  displayName: z.string().min(2).max(100),
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).optional(),
});
const updateFacultySchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});
const listQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/faculty
facultyRouter.get(
  '/',
  requireRole('admin', 'faculty', 'student'),
  validate({ query: listQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as { search?: string; page: string; limit: string };
      const page = parseInt(q.page || '1');
      const limit = parseInt(q.limit || '20');
      const { rows, total } = await repo.listFaculty({
        search: q.search, limit, offset: (page - 1) * limit,
      });
      res.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  }
);

// GET /api/faculty/me  (faculty self-view)
facultyRouter.get(
  '/me',
  requireRole('faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const f = await repo.getFacultyByUserId(req.session.userId!);
      if (!f) return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
      const assignments = await repo.getFacultyAssignments(f.id);
      res.json({ data: { ...f, assignments }, meta: {} });
    } catch (err) { next(err); }
  }
);

// GET /api/faculty/:id
facultyRouter.get(
  '/:id',
  requireRole('admin', 'faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const f = await repo.getFacultyById(req.params.id);
      if (!f) return next(new AppError('Faculty not found', 404, 'NOT_FOUND'));
      const assignments = await repo.getFacultyAssignments(f.id);
      res.json({ data: { ...f, assignments }, meta: {} });
    } catch (err) { next(err); }
  }
);

// POST /api/faculty
facultyRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createFacultySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      const passwordHash = await bcrypt.hash(body.password || env.SEED_PASSWORD, 12);
      const f = await repo.createFaculty({ ...body, passwordHash });
      res.status(201).json({ data: f, meta: {} });
    } catch (err) { next(err); }
  }
);

// PATCH /api/faculty/:id
facultyRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ body: updateFacultySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const f = await repo.updateFaculty(req.params.id, req.body);
      if (!f) return next(new AppError('Faculty not found', 404, 'NOT_FOUND'));
      res.json({ data: f, meta: {} });
    } catch (err) { next(err); }
  }
);


