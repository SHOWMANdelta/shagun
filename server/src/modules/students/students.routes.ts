import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentQuerySchema,
} from './students.schema.js';
import * as repo from './students.repo.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

export const studentsRouter = Router();

// GET /api/students
studentsRouter.get(
  '/',
  requireRole('admin', 'faculty'),
  validate({ query: listStudentQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as {
        batchId?: string; semester?: string; search?: string;
        page: string; limit: string;
      };
      const page = parseInt(q.page || '1');
      const limit = parseInt(q.limit || '20');
      const offset = (page - 1) * limit;
      const { rows, total } = await repo.listStudents({
        batchId: q.batchId,
        semester: q.semester ? parseInt(q.semester) : undefined,
        search: q.search,
        limit,
        offset,
      });
      res.json({
        data: rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) { next(err); }
  }
);

// GET /api/students/me  (student self-view)
studentsRouter.get(
  '/me',
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await repo.getStudentByUserId(req.session.userId!);
      if (!student) return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
      res.json({ data: student, meta: {} });
    } catch (err) { next(err); }
  }
);

// GET /api/students/:id
studentsRouter.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await repo.getStudentById(req.params.id);
      if (!student) return next(new AppError('Student not found', 404, 'NOT_FOUND'));
      // Students can only view their own profile
      if (req.session.role === 'student' && student.user_id !== req.session.userId) {
        return next(new AppError('Student not found', 404, 'NOT_FOUND'));
      }
      res.json({ data: student, meta: {} });
    } catch (err) { next(err); }
  }
);

// POST /api/students
studentsRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createStudentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      const passwordHash = await bcrypt.hash(
        body.password || env.SEED_PASSWORD, 12
      );
      const student = await repo.createStudent({
        enrollmentNo: body.enrollmentNo,
        displayName: body.displayName,
        batchId: body.batchId,
        currentSemester: body.currentSemester ?? 1,
        dob: body.dob,
        phone: body.phone,
        address: body.address,
        passwordHash,
      });
      res.status(201).json({ data: student, meta: {} });
    } catch (err) { next(err); }
  }
);

// PATCH /api/students/:id
studentsRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ body: updateStudentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await repo.updateStudent(req.params.id, req.body);
      if (!student) return next(new AppError('Student not found', 404, 'NOT_FOUND'));
      res.json({ data: student, meta: {} });
    } catch (err) { next(err); }
  }
);


