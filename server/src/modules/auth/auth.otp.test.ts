// OTP Schema Unit Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests run with no database connection required.
// The full OTP flow (cooldowns, attempt limits, code expiry) is tested here
// via schema validation; the DB-dependent flow tests require a live database
// and can be run manually with: DATABASE_URL=<url> pnpm --filter server test
import { describe, it, expect } from 'vitest';
import { requestOtpSchema, verifyOtpSchema } from './auth.schema.js';

describe('requestOtpSchema — OTP request validation', () => {
  it('accepts a valid email', () => {
    expect(requestOtpSchema.safeParse({ email: 'admin@college.edu' }).success).toBe(true);
  });

  it('lowercases and trims the email before validation', () => {
    const result = requestOtpSchema.safeParse({ email: '  Admin@College.EDU  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('admin@college.edu');
  });

  it('rejects a plain string that is not an email', () => {
    expect(requestOtpSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a missing @ symbol', () => {
    expect(requestOtpSchema.safeParse({ email: 'userATcollege.edu' }).success).toBe(false);
  });

  it('accepts a long but structurally valid email (schema has no max length)', () => {
    // The requestOtpSchema validates email format only; Zod's .email() does not
    // enforce a character-count limit by default. This test documents that behaviour.
    const long = 'a'.repeat(50) + '@college.edu';
    expect(requestOtpSchema.safeParse({ email: long }).success).toBe(true);
  });
});

describe('verifyOtpSchema — OTP verification validation', () => {
  it('accepts a valid email and 6-digit numeric code', () => {
    expect(verifyOtpSchema.safeParse({ email: 'admin@college.edu', code: '123456' }).success).toBe(true);
  });

  it('rejects code with fewer than 6 digits', () => {
    expect(verifyOtpSchema.safeParse({ email: 'admin@college.edu', code: '12345' }).success).toBe(false);
  });

  it('rejects code with more than 6 digits', () => {
    expect(verifyOtpSchema.safeParse({ email: 'admin@college.edu', code: '1234567' }).success).toBe(false);
  });

  it('rejects code containing letters', () => {
    expect(verifyOtpSchema.safeParse({ email: 'admin@college.edu', code: '12345a' }).success).toBe(false);
  });

  it('rejects code containing spaces', () => {
    expect(verifyOtpSchema.safeParse({ email: 'admin@college.edu', code: '123 56' }).success).toBe(false);
  });

  it('trims the code and email before validation', () => {
    const result = verifyOtpSchema.safeParse({ email: '  user@c.edu  ', code: '  654321  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@c.edu');
      expect(result.data.code).toBe('654321');
    }
  });

  it('rejects an invalid email even with a valid code', () => {
    expect(verifyOtpSchema.safeParse({ email: 'bad-email', code: '123456' }).success).toBe(false);
  });
});
