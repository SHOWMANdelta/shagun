// OTP sign-in suite — Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// Email delivery is mocked; OTP logic, cooldowns, attempts and session creation run for real.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import * as otpService from './otp.service.js';

const mocks = vi.hoisted(() => ({ sendOtpEmail: vi.fn() }));
vi.mock('./email.js', () => ({ sendOtpEmail: mocks.sendOtpEmail }));

describe('OTP sign-in suite', () => {
  const app = buildApp({ skipRateLimit: true });
  const ADMIN_EMAIL = 'admin@college.edu';
  const FAC1_EMAIL = 'priya.sharma@college.edu';
  const FAC2_EMAIL = 'rajan.mehta@college.edu';
  const UNKNOWN_EMAIL = 'nobody@college.edu';

  beforeAll(async () => {
    mocks.sendOtpEmail.mockReset();
    mocks.sendOtpEmail.mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    // Tests run against a persistent shared database
    await pool.query('DELETE FROM erp.auth_otp');
    mocks.sendOtpEmail.mockClear();
  });

  afterAll(async () => {
    await pool.end();
  });

  async function requestCode(email: string) {
    return request(app)
      .post('/api/auth/otp/request')
      .set('X-Requested-With', 'erp')
      .send({ email });
  }

  async function verifyCode(email: string, code: string) {
    return request(app)
      .post('/api/auth/otp/verify')
      .set('X-Requested-With', 'erp')
      .send({ email, code });
  }

  it('sends exactly one email with a valid 6-digit code for a registered email', async () => {
    const res = await requestCode(ADMIN_EMAIL);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/has been sent/i);
    expect(mocks.sendOtpEmail).toHaveBeenCalledTimes(1);

    const arg = mocks.sendOtpEmail.mock.calls[0][0] as {
      to: string;
      code: string;
      displayName: string;
    };
    expect(arg.to).toBe(ADMIN_EMAIL);
    expect(arg.code).toMatch(/^\d{6}$/);
    expect(arg.displayName).toBe('System Administrator');
  });

  it('does not send any email for an unregistered address (enumeration guard)', async () => {
    const res = await requestCode(UNKNOWN_EMAIL);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/has been sent/i);
    expect(mocks.sendOtpEmail).toHaveBeenCalledTimes(0);
  });

  it('enforces the 60-second cooldown between two code requests', async () => {
    const first = await requestCode(ADMIN_EMAIL);
    expect(first.status).toBe(200);

    const second = await requestCode(ADMIN_EMAIL);
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('OTP_COOLDOWN');
  });

  it('validates shape: malformed email and non-6-digit codes are rejected', async () => {
    const badEmail = await requestCode('not-an-email');
    expect(badEmail.status).toBe(400);

    const badCode = await verifyCode(ADMIN_EMAIL, '12ab');
    expect(badCode.status).toBe(400);
  });

  it('rejects a wrong code, then signs in with the right one', async () => {
    const stub = vi.spyOn(otpService.otpCodeGenerator, 'next').mockReturnValue('424242');
    const reqRes = await requestCode(FAC2_EMAIL);
    expect(reqRes.status).toBe(200);
    stub.mockRestore();

    const wrongRes = await verifyCode(FAC2_EMAIL, '000001');
    expect(wrongRes.status).toBe(401);

    const goodRes = await verifyCode(FAC2_EMAIL, '424242');
    expect(goodRes.status).toBe(200);
    expect(goodRes.body.data.identifier).toBe('FAC002');
    expect(goodRes.body.data.role).toBe('faculty');

    // Session cookie authenticates /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', goodRes.headers['set-cookie']);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.displayName).toBe('Prof. Rajan Mehta');
  });

  it('marks the code consumed: the same code cannot be reused', async () => {
    const stub = vi.spyOn(otpService.otpCodeGenerator, 'next').mockReturnValue('515151');
    await requestCode(FAC2_EMAIL);
    stub.mockRestore();

    const firstUse = await verifyCode(FAC2_EMAIL, '515151');
    expect(firstUse.status).toBe(200);

    const reuse = await verifyCode(FAC2_EMAIL, '515151');
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('OTP_INVALID');
  });

  it('expires verification after 5 wrong attempts for a fresh code', async () => {
    const stub = vi.spyOn(otpService.otpCodeGenerator, 'next').mockReturnValue('919191');
    const reqRes = await requestCode(FAC1_EMAIL);
    expect(reqRes.status).toBe(200);
    stub.mockRestore();

    let lastBodyCode = '';
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const r = await verifyCode(FAC1_EMAIL, '111111');
      lastStatus = r.status;
      lastBodyCode = (r.body?.error?.code as string) ?? '';
    }
    expect(lastStatus).toBe(401);
    expect(lastBodyCode).toBe('OTP_ATTEMPTS_EXCEEDED');

    // Even the correct code is now disabled
    const correct = await verifyCode(FAC1_EMAIL, '919191');
    expect(correct.status).toBe(401);
  });
});
