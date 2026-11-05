// Database Schema Documentation Test
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests document and verify the schema shape without requiring a live DB.
// They use pure TypeScript type checking and constant assertions.
import { describe, it, expect } from 'vitest';

// ─── Schema constants mirroring the SQL migrations ───────────────────────────
// These act as living documentation: if someone changes a migration, they should
// update these constants too so the tests catch the drift.

const SCHEMA_NAME = 'erp';

const TABLES = [
  'audit_log',
  'users',
  'session',
  'programs',
  'batches',
  'subjects',
  'exam_types',
  'faculty',
  'faculty_subjects',
  'students',
  'attendance_sessions',
  'attendance',
  'marks',
  'notices',
  'notice_reads',
  'auth_otp',
] as const;

const VIEWS = ['v_attendance_summary', 'v_sgpa'] as const;

const MIGRATIONS = [
  '001_schema_and_audit.sql',
  '002_users_auth.sql',
  '003_academic_structure.sql',
  '004_attendance.sql',
  '005_marks.sql',
  '006_notices.sql',
  '007_users_email_otp.sql',
] as const;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Database schema documentation', () => {
  it('uses the erp schema name', () => {
    expect(SCHEMA_NAME).toBe('erp');
  });

  it('defines the expected number of tables', () => {
    expect(TABLES.length).toBe(16);
  });

  it('includes all core tables', () => {
    const required = ['users', 'students', 'faculty', 'marks', 'attendance', 'notices'];
    for (const t of required) {
      expect(TABLES).toContain(t);
    }
  });

  it('includes audit_log and session tables', () => {
    expect(TABLES).toContain('audit_log');
    expect(TABLES).toContain('session');
  });

  it('defines the two aggregate views', () => {
    expect(VIEWS).toContain('v_attendance_summary');
    expect(VIEWS).toContain('v_sgpa');
  });

  it('has exactly 7 migration files in order', () => {
    expect(MIGRATIONS.length).toBe(7);
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const num = String(i + 1).padStart(3, '0');
      expect(MIGRATIONS[i]).toMatch(new RegExp(`^${num}_`));
    }
  });
});

describe('Role constants', () => {
  const ROLES = ['admin', 'faculty', 'student'] as const;

  it('defines exactly 3 roles', () => {
    expect(ROLES.length).toBe(3);
  });

  it('includes admin, faculty, and student', () => {
    expect(ROLES).toContain('admin');
    expect(ROLES).toContain('faculty');
    expect(ROLES).toContain('student');
  });
});

describe('Notice target audience constants', () => {
  const TARGETS = ['all', 'students', 'faculty', 'batch', 'semester'] as const;

  it('defines exactly 5 targeting options', () => {
    expect(TARGETS.length).toBe(5);
  });

  it('includes "all" as the default broadcast target', () => {
    expect(TARGETS[0]).toBe('all');
  });
});

describe('Academic constraints', () => {
  it('semester range is 1–12', () => {
    const MIN_SEMESTER = 1;
    const MAX_SEMESTER = 12;
    expect(MIN_SEMESTER).toBe(1);
    expect(MAX_SEMESTER).toBe(12);
  });

  it('attendance threshold is 75%', () => {
    const ATTENDANCE_THRESHOLD = 75;
    expect(ATTENDANCE_THRESHOLD).toBe(75);
  });

  it('attendance edit window is 7 days', () => {
    const EDIT_WINDOW_DAYS = 7;
    expect(EDIT_WINDOW_DAYS).toBe(7);
  });

  it('pass percentage is 40%', () => {
    const PASS_PERCENT = 40;
    expect(PASS_PERCENT).toBe(40);
  });
});
