-- ============================================================
-- Migration 002: Users and Authentication
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================
SET search_path TO erp, public;

-- ENUM: User roles
DO $$ BEGIN
  CREATE TYPE erp.user_role AS ENUM ('admin', 'faculty', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USERS table
CREATE TABLE IF NOT EXISTS erp.users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  role                erp.user_role NOT NULL,
  identifier          TEXT        NOT NULL UNIQUE,  -- enrollment_no / employee_code / 'admin'
  display_name        TEXT        NOT NULL,
  password_hash       TEXT        NOT NULL,
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  failed_attempts     INTEGER     NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_identifier_nonempty CHECK (char_length(identifier) > 0),
  CONSTRAINT chk_display_name_nonempty CHECK (char_length(display_name) > 0)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON erp.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON erp.users(is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION erp.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON erp.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON erp.users
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- Audit trigger for users
CREATE OR REPLACE FUNCTION erp.fn_audit_users()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO erp.audit_log(table_name, record_id, action, new_data)
    VALUES ('users', NEW.id, 'INSERT', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO erp.audit_log(table_name, record_id, action, old_data, new_data)
    VALUES ('users', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO erp.audit_log(table_name, record_id, action, old_data)
    VALUES ('users', OLD.id, 'DELETE', to_jsonb(OLD));
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_users ON erp.users;
CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON erp.users
  FOR EACH ROW EXECUTE FUNCTION erp.fn_audit_users();

-- SESSION STORE TABLE for connect-pg-simple
CREATE TABLE IF NOT EXISTS erp.session (
  sid     TEXT        PRIMARY KEY,
  sess    JSONB       NOT NULL,
  expire  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON erp.session(expire);
