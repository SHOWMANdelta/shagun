// Students Schema Unit Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests run with no database connection required.
import { describe, it, expect } from 'vitest';
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentQuerySchema,
} from './students.schema.js';

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('createStudentSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav Patel',
      batchId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('defaults currentSemester to 1', () => {
    const result = createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav Patel',
      batchId: VALID_UUID,
    });
    if (result.success) expect(result.data.currentSemester).toBe(1);
  });

  it('accepts a full payload with optional fields', () => {
    const result = createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav Patel',
      batchId: VALID_UUID,
      currentSemester: 3,
      dob: '2004-05-15',
      phone: '9876543210',
      address: '123 College Road',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid batchId (not a UUID)', () => {
    const result = createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav Patel',
      batchId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects displayName shorter than 2 chars', () => {
    expect(createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'A',
      batchId: VALID_UUID,
    }).success).toBe(false);
  });

  it('rejects semester out of range (0)', () => {
    expect(createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav',
      batchId: VALID_UUID,
      currentSemester: 0,
    }).success).toBe(false);
  });

  it('rejects semester out of range (13)', () => {
    expect(createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav',
      batchId: VALID_UUID,
      currentSemester: 13,
    }).success).toBe(false);
  });

  it('rejects an invalid dob format', () => {
    expect(createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav Patel',
      batchId: VALID_UUID,
      dob: '15-05-2004',
    }).success).toBe(false);
  });

  it('rejects a weak password (no digit)', () => {
    expect(createStudentSchema.safeParse({
      enrollmentNo: '24BCA001',
      displayName: 'Aarav Patel',
      batchId: VALID_UUID,
      password: 'onlyletters',
    }).success).toBe(false);
  });
});

describe('updateStudentSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(updateStudentSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial updates', () => {
    const result = updateStudentSchema.safeParse({ displayName: 'New Name', currentSemester: 2 });
    expect(result.success).toBe(true);
  });

  it('rejects isActive as a non-boolean', () => {
    expect(updateStudentSchema.safeParse({ isActive: 'yes' }).success).toBe(false);
  });
});

describe('listStudentQuerySchema', () => {
  it('defaults page to 1 and limit to 20', () => {
    const result = listStudentQuerySchema.safeParse({});
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces page and limit from strings', () => {
    const result = listStudentQuerySchema.safeParse({ page: '2', limit: '10' });
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('rejects limit above 100', () => {
    expect(listStudentQuerySchema.safeParse({ limit: '200' }).success).toBe(false);
  });
});
