import { z } from 'zod';

export const createStudentSchema = z.object({
  enrollmentNo: z.string().min(1).max(30),
  displayName: z.string().min(2).max(100),
  batchId: z.string().uuid(),
  currentSemester: z.number().int().min(1).max(12).default(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  password: z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/).optional(),
});

export const updateStudentSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  isActive: z.boolean().optional(),
});

export const listStudentQuerySchema = z.object({
  batchId: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
