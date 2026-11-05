// Auth Schema & AppError Unit Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests run with no database connection required.
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  changePasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from '../../modules/auth/auth.schema.js';
import { AppError } from '../../utils/AppError.js';

describe('loginSchema', () => {
  it('accepts valid identifier and password', () => {
    const result = loginSchema.safeParse({ identifier: 'admin', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects empty identifier', () => {
    const result = loginSchema.safeParse({ identifier: '', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ identifier: 'admin', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts strong new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects new password shorter than 8 chars', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects new password without a digit', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'alllowercase',
    });
    expect(result.success).toBe(false);
  });

  it('rejects new password without a letter', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: '12345678',
    });
    expect(result.success).toBe(false);
  });
});

describe('requestOtpSchema', () => {
  it('accepts a valid email', () => {
    const result = requestOtpSchema.safeParse({ email: 'user@college.edu' });
    expect(result.success).toBe(true);
  });

  it('lowercases and trims the email', () => {
    const result = requestOtpSchema.safeParse({ email: '  Admin@College.EDU  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('admin@college.edu');
  });

  it('rejects invalid email', () => {
    expect(requestOtpSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});

describe('verifyOtpSchema', () => {
  it('accepts valid email + 6-digit code', () => {
    const result = verifyOtpSchema.safeParse({ email: 'user@college.edu', code: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects code shorter than 6 digits', () => {
    expect(verifyOtpSchema.safeParse({ email: 'u@c.com', code: '12345' }).success).toBe(false);
  });

  it('rejects code with non-digit characters', () => {
    expect(verifyOtpSchema.safeParse({ email: 'u@c.com', code: '12345a' }).success).toBe(false);
  });

  it('rejects code longer than 6 digits', () => {
    expect(verifyOtpSchema.safeParse({ email: 'u@c.com', code: '1234567' }).success).toBe(false);
  });
});

describe('AppError', () => {
  it('creates an error with default status 400 and code BAD_REQUEST', () => {
    const err = new AppError('Something went wrong');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.name).toBe('AppError');
  });

  it('accepts custom statusCode and code', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('accepts optional details', () => {
    const details = { field: 'email' };
    const err = new AppError('Validation failed', 422, 'VALIDATION_ERROR', details);
    expect(err.details).toEqual(details);
  });

  it('is catchable as a plain Error', () => {
    const caught = (() => {
      try { throw new AppError('test', 401, 'UNAUTHORIZED'); }
      catch (e) { return e; }
    })();
    expect(caught instanceof Error).toBe(true);
    expect((caught as AppError).statusCode).toBe(401);
  });
});
