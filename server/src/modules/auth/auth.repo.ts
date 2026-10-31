import { query } from '../../db/pool.js';

export interface UserRow {
  id: string;
  role: string;
  identifier: string;
  display_name: string;
  password_hash: string;
  is_active: boolean;
  failed_attempts: number;
  locked_until: string | null;
  password_changed_at: string;
}

export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const res = await query<UserRow>(
    `SELECT id, role, identifier, display_name, password_hash,
            is_active, failed_attempts, locked_until, password_changed_at
     FROM erp.users
     WHERE identifier = $1`,
    [identifier]
  );
  return res.rows[0] ?? null;
}

export async function incrementFailedAttempts(userId: string): Promise<void> {
  await query(
    `UPDATE erp.users
     SET failed_attempts = failed_attempts + 1,
         locked_until = CASE WHEN failed_attempts + 1 >= 5
                             THEN now() + INTERVAL '15 minutes'
                             ELSE locked_until END
     WHERE id = $1`,
    [userId]
  );
}

export async function resetFailedAttempts(userId: string): Promise<void> {
  await query(
    `UPDATE erp.users
     SET failed_attempts = 0, locked_until = NULL
     WHERE id = $1`,
    [userId]
  );
}

export async function updatePassword(
  userId: string,
  newHash: string
): Promise<void> {
  await query(
    `UPDATE erp.users
     SET password_hash = $1,
         password_changed_at = now(),
         failed_attempts = 0,
         locked_until = NULL
     WHERE id = $2`,
    [newHash, userId]
  );
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  // Delete all sessions for this user from the session store
  await query(
    `DELETE FROM erp.session
     WHERE sess->>'userId' = $1`,
    [userId]
  );
}
