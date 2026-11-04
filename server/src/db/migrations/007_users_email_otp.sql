-- ============================================================
-- Migration 007: Email identities + email OTP sign-in
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================
SET search_path TO erp, public;

BEGIN;

-- USERS: nullable unique email (case-insensitive uniqueness)
ALTER TABLE erp.users ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
  ON erp.users (lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_lower
  ON erp.users (lower(email))
  WHERE email IS NOT NULL;

-- Backfill demo emails for existing seeded users (idempotent: only fills NULLs)
UPDATE erp.users SET email = u.new_email
FROM (
  VALUES
    ('admin',    'admin@college.edu'),
    ('FAC001',   'priya.sharma@college.edu'),
    ('FAC002',   'rajan.mehta@college.edu'),
    ('24BCA001', 'aarav.patel@college.edu'),
    ('24BCA002', 'diya.singh@college.edu'),
    ('24BCA003', 'karan.verma@college.edu')
) AS u(identifier, new_email)
WHERE erp.users.identifier = u.identifier
  AND erp.users.email IS NULL;

-- OTP codes: single-use, hashed, short-lived
CREATE TABLE IF NOT EXISTS erp.auth_otp (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES erp.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  code_hash    TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed     BOOLEAN     NOT NULL DEFAULT FALSE,
  consumed_at  TIMESTAMPTZ,
  attempts     INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_otp_attempts CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_auth_otp_email_created
  ON erp.auth_otp (lower(email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_otp_user
  ON erp.auth_otp (user_id, created_at DESC);

COMMIT;
