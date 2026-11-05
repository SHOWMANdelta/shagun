// Notices Schema & Pagination Unit Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests run with no database connection required.
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parsePagination } from '../../utils/pagination.js';

// Inline notice schemas (mirrors notices.routes.ts) to avoid importing the
// route module which would pull in DB/pool dependencies.
const createNoticeSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(1).max(5000),
  target: z.enum(['all', 'students', 'faculty', 'batch', 'semester']).default('all'),
  targetBatchId: z.string().uuid().optional(),
  targetSemester: z.number().int().min(1).max(12).optional(),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

const listNoticeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().max(100).optional(),
  target: z.enum(['all', 'students', 'faculty', 'batch', 'semester']).optional(),
});

describe('createNoticeSchema', () => {
  it('accepts a minimal valid notice', () => {
    expect(createNoticeSchema.safeParse({
      title: 'Welcome Notice',
      body: 'Welcome to the ERP system.',
    }).success).toBe(true);
  });

  it('defaults target to "all" and isPinned to false', () => {
    const result = createNoticeSchema.safeParse({
      title: 'Welcome Notice',
      body: 'Welcome to the ERP system.',
    });
    if (result.success) {
      expect(result.data.target).toBe('all');
      expect(result.data.isPinned).toBe(false);
    }
  });

  it('accepts a fully-specified notice', () => {
    expect(createNoticeSchema.safeParse({
      title: 'Exam Schedule',
      body: 'Mid-term exams will be held next week.',
      target: 'students',
      isPinned: true,
      expiresAt: '2026-12-31T23:59:59.000Z',
    }).success).toBe(true);
  });

  it('rejects title shorter than 2 chars', () => {
    expect(createNoticeSchema.safeParse({ title: 'X', body: 'Some body text' }).success).toBe(false);
  });

  it('rejects empty body', () => {
    expect(createNoticeSchema.safeParse({ title: 'Valid Title', body: '' }).success).toBe(false);
  });

  it('rejects an invalid target enum value', () => {
    expect(createNoticeSchema.safeParse({
      title: 'Valid Title', body: 'Body', target: 'everyone',
    }).success).toBe(false);
  });

  it('rejects targetSemester outside 1–12', () => {
    expect(createNoticeSchema.safeParse({
      title: 'Valid Title', body: 'Body', target: 'semester', targetSemester: 0,
    }).success).toBe(false);

    expect(createNoticeSchema.safeParse({
      title: 'Valid Title', body: 'Body', target: 'semester', targetSemester: 13,
    }).success).toBe(false);
  });

  it('rejects an invalid expiresAt (not ISO datetime)', () => {
    expect(createNoticeSchema.safeParse({
      title: 'Valid Title', body: 'Body', expiresAt: '2026-12-31',
    }).success).toBe(false);
  });
});

describe('listNoticeQuerySchema', () => {
  it('defaults page to 1 and limit to 20', () => {
    const result = listNoticeQuerySchema.safeParse({});
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces page and limit from strings', () => {
    const result = listNoticeQuerySchema.safeParse({ page: '3', limit: '5' });
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(5);
    }
  });

  it('rejects limit above 50', () => {
    expect(listNoticeQuerySchema.safeParse({ limit: '51' }).success).toBe(false);
  });

  it('accepts a valid target filter', () => {
    expect(listNoticeQuerySchema.safeParse({ target: 'faculty' }).success).toBe(true);
  });
});

describe('parsePagination', () => {
  const cols = ['name', 'created_at', 'enrollment_no'];

  it('returns defaults when given an empty query', () => {
    const result = parsePagination({}, cols, 'name');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('ASC');
  });

  it('computes correct offset for page 3 limit 10', () => {
    const result = parsePagination({ page: '3', limit: '10' }, cols, 'name');
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
  });

  it('caps limit at 100', () => {
    const result = parsePagination({ limit: '999' }, cols, 'name');
    expect(result.limit).toBe(100);
  });

  it('falls back to default limit of 20 when limit is 0 (parseInt("0") is falsy)', () => {
    // parsePagination uses `parseInt(str) || 20` — 0 is falsy so it
    // falls back to 20, then Math.max(1, 20) = 20. This test documents the behaviour.
    const result = parsePagination({ limit: '0' }, cols, 'name');
    expect(result.limit).toBe(20);
  });

  it('defaults page to 1 for non-numeric input', () => {
    const result = parsePagination({ page: 'abc' }, cols, 'name');
    expect(result.page).toBe(1);
  });

  it('uses the allowed sortBy column', () => {
    const result = parsePagination({ sortBy: 'created_at' }, cols, 'name');
    expect(result.sortBy).toBe('created_at');
  });

  it('falls back to default sort column for disallowed sortBy', () => {
    const result = parsePagination({ sortBy: 'password_hash' }, cols, 'name');
    expect(result.sortBy).toBe('name');
  });

  it('accepts DESC sort order', () => {
    const result = parsePagination({ sortOrder: 'DESC' }, cols, 'name');
    expect(result.sortOrder).toBe('DESC');
  });

  it('defaults sortOrder to ASC for invalid input', () => {
    const result = parsePagination({ sortOrder: 'RANDOM' }, cols, 'name');
    expect(result.sortOrder).toBe('ASC');
  });
});
