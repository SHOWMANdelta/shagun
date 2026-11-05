// Marks Schema & CSV Utils Unit Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests run with no database connection required.
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseCSV, toCSV } from '../../utils/csv.js';

// Inline the marks schemas (mirrors marks.routes.ts) so we test them without
// importing the route module, which would pull in DB dependencies.
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

const UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('marksEntrySchema', () => {
  it('accepts a valid marks entry', () => {
    expect(marksEntrySchema.safeParse({
      studentId: UUID, subjectId: UUID, examTypeId: UUID, batchId: UUID,
      marksObtained: 25,
    }).success).toBe(true);
  });

  it('accepts 0 marks (edge case)', () => {
    expect(marksEntrySchema.safeParse({
      studentId: UUID, subjectId: UUID, examTypeId: UUID, batchId: UUID,
      marksObtained: 0,
    }).success).toBe(true);
  });

  it('rejects negative marks', () => {
    expect(marksEntrySchema.safeParse({
      studentId: UUID, subjectId: UUID, examTypeId: UUID, batchId: UUID,
      marksObtained: -1,
    }).success).toBe(false);
  });

  it('rejects non-UUID studentId', () => {
    expect(marksEntrySchema.safeParse({
      studentId: 'not-a-uuid', subjectId: UUID, examTypeId: UUID,
      batchId: UUID, marksObtained: 10,
    }).success).toBe(false);
  });
});

describe('marksBulkSchema', () => {
  it('accepts an array with one valid entry', () => {
    expect(marksBulkSchema.safeParse({
      entries: [{ studentId: UUID, subjectId: UUID, examTypeId: UUID, batchId: UUID, marksObtained: 30 }],
    }).success).toBe(true);
  });

  it('rejects an empty entries array', () => {
    expect(marksBulkSchema.safeParse({ entries: [] }).success).toBe(false);
  });
});

describe('publishSchema', () => {
  it('accepts three valid UUIDs', () => {
    expect(publishSchema.safeParse({ subjectId: UUID, examTypeId: UUID, batchId: UUID }).success).toBe(true);
  });

  it('rejects if any UUID is missing', () => {
    expect(publishSchema.safeParse({ subjectId: UUID, examTypeId: UUID }).success).toBe(false);
  });
});

describe('parseCSV', () => {
  it('returns empty array for a header-only CSV', () => {
    expect(parseCSV('enrollment_no,display_name')).toEqual([]);
  });

  it('parses a simple two-column CSV', () => {
    const csv = 'enrollment_no,display_name\n24BCA001,Aarav Patel\n24BCA002,Diya Singh';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ enrollment_no: '24BCA001', display_name: 'Aarav Patel' });
    expect(rows[1]).toEqual({ enrollment_no: '24BCA002', display_name: 'Diya Singh' });
  });

  it('handles quoted fields with commas inside', () => {
    const csv = 'name,address\nAarav,"123, MG Road"';
    const rows = parseCSV(csv);
    expect(rows[0].address).toBe('123, MG Road');
  });

  it('handles escaped quotes inside quoted fields', () => {
    const csv = 'name,note\nAarav,"He said ""hello"""';
    const rows = parseCSV(csv);
    expect(rows[0].note).toBe('He said "hello"');
  });

  it('returns empty array for fewer than 2 lines', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('only-header')).toEqual([]);
  });
});

describe('toCSV', () => {
  it('returns empty string for empty rows', () => {
    expect(toCSV([])).toBe('');
  });

  it('produces a valid CSV with header and rows', () => {
    const rows = [
      { enrollment_no: '24BCA001', display_name: 'Aarav Patel' },
      { enrollment_no: '24BCA002', display_name: 'Diya Singh' },
    ];
    const csv = toCSV(rows, [
      { key: 'enrollment_no', label: 'Enrollment No' },
      { key: 'display_name', label: 'Full Name' },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Enrollment No,Full Name');
    expect(lines[1]).toBe('24BCA001,Aarav Patel');
    expect(lines[2]).toBe('24BCA002,Diya Singh');
  });

  it('escapes values that contain commas', () => {
    const csv = toCSV([{ address: '123, MG Road' }]);
    expect(csv).toContain('"123, MG Road"');
  });

  it('round-trips through parseCSV → toCSV', () => {
    const original = 'Enrollment No,Full Name\n24BCA001,Aarav Patel\n24BCA002,Diya Singh';
    const parsed = parseCSV(original);
    const regenerated = toCSV(parsed as unknown as Record<string, unknown>[], [
      { key: 'Enrollment No', label: 'Enrollment No' },
      { key: 'Full Name', label: 'Full Name' },
    ]);
    expect(regenerated).toBe(original);
  });
});
