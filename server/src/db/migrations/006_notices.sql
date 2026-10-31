-- ============================================================
-- Migration 006: Notices
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================
SET search_path TO erp, public;

DO $$ BEGIN
  CREATE TYPE erp.notice_target AS ENUM ('all', 'students', 'faculty', 'batch', 'semester');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS erp.notices (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT    NOT NULL,
  body         TEXT    NOT NULL,
  target       erp.notice_target NOT NULL DEFAULT 'all',
  target_batch_id  UUID REFERENCES erp.batches(id) ON DELETE SET NULL,
  target_semester  INTEGER CHECK (target_semester BETWEEN 1 AND 12),
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ,
  created_by   UUID    NOT NULL REFERENCES erp.users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notices_created_at ON erp.notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_expires_at ON erp.notices(expires_at);
CREATE INDEX IF NOT EXISTS idx_notices_target ON erp.notices(target);

DROP TRIGGER IF EXISTS trg_notices_updated_at ON erp.notices;
CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON erp.notices
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- NOTICE READ TRACKING
CREATE TABLE IF NOT EXISTS erp.notice_reads (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES erp.notices(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES erp.users(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_notice_reads UNIQUE (notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_reads_user ON erp.notice_reads(user_id);
