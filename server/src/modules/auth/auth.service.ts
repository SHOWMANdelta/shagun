import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/AppError.js';
import * as authRepo from './auth.repo.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

const LOCK_THRESHOLD = 5;

export async function loginService(input: LoginInput) {
  const user = await authRepo.findUserByIdentifier(input.identifier);

  if (!user || !user.is_active) {
    // Constant-time guard: always compare even for missing users
    await bcrypt.compare(input.password, '$2b$12$invalidhashinvalidhashinvalidhas');
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check account lockout
  if (user.locked_until) {
    const lockedUntil = new Date(user.locked_until);
    if (lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account locked. Try again in ${minutesLeft} minute(s).`,
        429,
        'ACCOUNT_LOCKED'
      );
    }
  }

  const passwordValid = await bcrypt.compare(input.password, user.password_hash);

  if (!passwordValid) {
    await authRepo.incrementFailedAttempts(user.id);
    const remaining = LOCK_THRESHOLD - (user.failed_attempts + 1);
    if (remaining <= 0) {
      throw new AppError(
        'Invalid credentials. Account locked for 15 minutes.',
        401,
        'INVALID_CREDENTIALS'
      );
    }
    throw new AppError(
      `Invalid credentials. ${remaining} attempt(s) remaining before lockout.`,
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Successful login — reset failures
  await authRepo.resetFailedAttempts(user.id);

  return {
    id: user.id,
    role: user.role,
    identifier: user.identifier,
    displayName: user.display_name,
  };
}

export async function changePasswordService(
  userId: string,
  input: ChangePasswordInput
) {
  // Fetch user by id directly
  const { query } = await import('../../db/pool.js');
  const res = await query(
    'SELECT password_hash FROM erp.users WHERE id = $1',
    [userId]
  );
  if (!res.rows[0]) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  const currentHash = (res.rows[0] as { password_hash: string }).password_hash;

  const valid = await bcrypt.compare(input.currentPassword, currentHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await authRepo.updatePassword(userId, newHash);
  // Invalidate all other sessions
  await authRepo.invalidateUserSessions(userId);
}
