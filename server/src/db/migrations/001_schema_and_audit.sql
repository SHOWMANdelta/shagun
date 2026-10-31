-- ============================================================
-- Migration 001: Schema, Extensions, and Audit Infrastructure
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS erp;
SET search_path TO erp, public;

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- AUDIT LOG TABLE
-- Append-only; triggers block UPDATE/DELETE on this table
-- ============================================================
CREATE TABLE IF NOT EXISTS erp.audit_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT        NOT NULL,
  record_id     UUID        NOT NULL,
  action        TEXT        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_by    UUID,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_data      JSONB,
  new_data      JSONB
);

-- Protect audit log from modification
CREATE OR REPLACE FUNCTION erp.fn_audit_protect()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only. Modification is forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_protect ON erp.audit_log;
CREATE TRIGGER trg_audit_log_protect
  BEFORE UPDATE OR DELETE ON erp.audit_log
  FOR EACH ROW EXECUTE FUNCTION erp.fn_audit_protect();
