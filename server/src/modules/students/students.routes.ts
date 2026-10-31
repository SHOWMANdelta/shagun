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

// PATCH /api/students/:id/deactivate
studentsRouter.patch(
  '/:id/deactivate',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await repo.updateStudent(req.params.id, { isActive: false });
      if (!student) return next(new AppError('Student not found', 404, 'NOT_FOUND'));
      res.json({ data: student, meta: {} });
    } catch (err) { next(err); }
  }
);

// POST /api/students/import-preview
studentsRouter.post(
  '/import-preview',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { parseCSV } = await import('../../utils/csv.js');
      const csv = req.body.csv as string;
      if (!csv) throw new AppError('CSV data is required', 400);

      const parsed = parseCSV(csv);
      const validRows: Record<string, string>[] = [];
      const invalidRows: { row: Record<string, string>; reason: string }[] = [];

      for (const row of parsed) {
        if (!row.enrollment_no || !row.display_name) {
          invalidRows.push({ row, reason: 'Missing enrollment_no or display_name' });
        } else {
          validRows.push(row);
        }
      }

      res.json({ data: { validRows, invalidRows }, meta: { total: parsed.length } });
    } catch (err) { next(err); }
  }
);

// POST /api/students/import-confirm
studentsRouter.post(
  '/import-confirm',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows, batchId } = req.body;
      if (!Array.isArray(rows) || !batchId) {
        throw new AppError('Invalid payload: rows and batchId required', 400);
      }

      const defaultHash = await bcrypt.hash(env.SEED_PASSWORD, 12);
      const created: repo.StudentRow[] = [];

      for (const r of rows) {
        const student = await repo.createStudent({
          enrollmentNo: r.enrollment_no,
          displayName: r.display_name,
          batchId,
          currentSemester: parseInt(r.current_semester || '1', 10),
          phone: r.phone,
          address: r.address,
          passwordHash: defaultHash,
        });
        created.push(student);
      }

      res.status(201).json({
        data: {
          importedCount: created.length,
          credentials: created.map(s => ({
            enrollmentNo: s.enrollment_no,
            displayName: s.display_name,
            defaultPassword: env.SEED_PASSWORD,
          })),
        },
        meta: {},
      });
    } catch (err) { next(err); }
  }
);

// GET /api/students/export/csv
studentsRouter.get(
  '/export/csv',
  requireRole('admin', 'faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { toCSV } = await import('../../utils/csv.js');
      const { rows } = await repo.listStudents({ limit: 1000, offset: 0 });
      const csvStr = toCSV(
        rows as unknown as Record<string, unknown>[],
        [
          { key: 'enrollment_no', label: 'Enrollment No' },
          { key: 'display_name', label: 'Full Name' },
          { key: 'batch_name', label: 'Batch' },
          { key: 'current_semester', label: 'Semester' },
          { key: 'phone', label: 'Phone' },
        ]
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
      res.send(csvStr);
    } catch (err) { next(err); }
  }
);


