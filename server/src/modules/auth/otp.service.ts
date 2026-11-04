// Email OTP service for passwordless sign-in
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { createHash } from 'crypto';
import { randomInt } from 'crypto';
import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';

const MAX_CODES_PER_HOUR = 5;           // per email
const MAX_VERIFY_ATTEMPTS = 5;          // then code becomes invalid

export interface OtpUser {
  id: string;
  role: string;
  identifier: string;
  displayName: string;
  email: string;
}

/**
 * Code generator behind an indirection object so tests can stub it reliably
 * (spyOn on a module's own export binding is not reliable in ESM).
 */
export const otpCodeGenerator = {
  next(): string {
    return String(randomInt(100000, 1000000));
  },
};

export function hashOtpCode(code: string): string {
  return createHash('sha256').update(String(code)).digest('hex');
}

async function findUserByEmail(email: string): Promise<OtpUser | null> {
  const res = await query(
    `SELECT id, role, identifier, display_name, email
     FROM erp.users
     WHERE lower(email) = lower($1) AND is_active = TRUE`,
    [email]
  );
  const row = res.rows[0] as
    | { id: string; role: string; identifier: string; display_name: string; email: string }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    identifier: row.identifier,
    displayName: row.display_name,
    email: row.email,
  };
}

/**
 * Issues a new OTP for the email if it belongs to an active user.
 * Returns null when the email is unknown (the caller answers generically
 * either way to prevent account enumeration), else the user and code.
 */
export async function issueOtpForEmail(
  rawEmail: string
): Promise<{ user: OtpUser; code: string } | null> {
  const email = rawEmail.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) return null;

  // Per-email cooldown
  const cooldownRes = await query(
    `SELECT 1 FROM erp.auth_otp
     WHERE lower(email) = $1 AND created_at > now() - interval '60 seconds'
     LIMIT 1`,
    [email]
  );
  if (cooldownRes.rows.length > 0) {
    throw new AppError('A code was just sent. Please wait a minute and retry.', 429, 'OTP_COOLDOWN');
  }

  // Per-email hourly cap
  const capRes = await query(
    `SELECT count(*) AS n FROM erp.auth_otp
     WHERE lower(email) = $1 AND created_at > now() - interval '1 hour'`,
    [email]
  );
  const recentCount = parseInt(String((capRes.rows[0] as { n: string }).n), 10);
  if (recentCount >= MAX_CODES_PER_HOUR) {
    throw new AppError('Too many codes requested. Try again later.', 429, 'OTP_RATE_LIMITED');
  }

  const code = otpCodeGenerator.next();
  await query(
    `INSERT INTO erp.auth_otp (user_id, email, code_hash, expires_at)
     VALUES ($1, $2, $3, now() + interval '10 minutes')`,
    [user.id, email, hashOtpCode(code)]
  );

  return { user, code };
}

/** Validates an OTP and returns the user for session establishment. */
export async function verifyOtpForEmail(
  rawEmail: string,
  rawCode: string
): Promise<OtpUser> {
  const email = rawEmail.trim().toLowerCase();
  const code = String(rawCode).trim();

  const res = await query(
    `SELECT o.id, o.user_id, o.code_hash, o.expires_at, o.attempts,
            u.id AS uid, u.role, u.identifier, u.display_name, u.email, u.is_active
     FROM erp.auth_otp o
     JOIN erp.users u ON u.id = o.user_id
     WHERE lower(o.email) = $1 AND o.consumed = FALSE
     ORDER BY o.created_at DESC
     LIMIT 1`,
    [email]
  );
  const row = res.rows[0] as
    | {
        id: string;
        user_id: string;
        code_hash: string;
        expires_at: string;
        attempts: number;
        uid: string;
        role: string;
        identifier: string;
        display_name: string;
        email: string;
        is_active: boolean;
      }
    | undefined;

  const invalid = new AppError('Invalid or expired code.', 401, 'OTP_INVALID');

  if (!row || !row.is_active) throw invalid;

  // Expired code must not be reusable
  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError(
      'Too many wrong attempts. Request a new code.',
      401,
      'OTP_ATTEMPTS_EXCEEDED'
    );
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new AppError('Code expired. Request a new one.', 401, 'OTP_EXPIRED');
  }

  const matches = row.code_hash === hashOtpCode(code);
  if (!matches) {
    await query('UPDATE erp.auth_otp SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    throw invalid;
  }

  await query(
    `UPDATE erp.auth_otp
     SET consumed = TRUE, consumed_at = now(), attempts = attempts + 1
     WHERE id = $1 AND consumed = FALSE`,
    [row.id]
  );

  return {
    id: row.uid,
    role: row.role,
    identifier: row.identifier,
    displayName: row.display_name,
    email: row.email,
  };
}
