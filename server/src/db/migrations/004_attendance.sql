-- ============================================================
-- Migration 004: Attendance
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================
SET search_path TO erp, public;

DO $$ BEGIN
  CREATE TYPE erp.attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ATTENDANCE_SESSIONS: one record per class session
CREATE TABLE IF NOT EXISTS erp.attendance_sessions (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   UUID    NOT NULL REFERENCES erp.subjects(id) ON DELETE RESTRICT,
  batch_id     UUID    NOT NULL REFERENCES erp.batches(id) ON DELETE RESTRICT,
  faculty_id   UUID    NOT NULL REFERENCES erp.faculty(id) ON DELETE RESTRICT,
  session_date DATE    NOT NULL,  -- stored as YYYY-MM-DD, normalized to IST
  topic        TEXT,
  is_locked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_session_subject_batch_date UNIQUE (subject_id, batch_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_att_sessions_batch ON erp.attendance_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_att_sessions_date  ON erp.attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_att_sessions_subject ON erp.attendance_sessions(subject_id);

DROP TRIGGER IF EXISTS trg_att_sessions_updated_at ON erp.attendance_sessions;
CREATE TRIGGER trg_att_sessions_updated_at
  BEFORE UPDATE ON erp.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- ATTENDANCE: per-student status per session
CREATE TABLE IF NOT EXISTS erp.attendance (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID    NOT NULL REFERENCES erp.attendance_sessions(id) ON DELETE CASCADE,
  student_id   UUID    NOT NULL REFERENCES erp.students(id) ON DELETE CASCADE,
  status       erp.attendance_status NOT NULL DEFAULT 'absent',
  remarks      TEXT,
  marked_by    UUID    REFERENCES erp.faculty(id),
  marked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_attendance_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON erp.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON erp.attendance(student_id);

-- VIEW: Attendance summary per student per subject
CREATE OR REPLACE VIEW erp.v_attendance_summary AS
SELECT
  a.student_id,
  sess.subject_id,
  sess.batch_id,
  COUNT(*)                                        AS total_sessions,
  COUNT(*) FILTER (WHERE a.status = 'present')    AS present_count,
  COUNT(*) FILTER (WHERE a.status = 'late')       AS late_count,
  COUNT(*) FILTER (WHERE a.status = 'absent')     AS absent_count,
  ROUND(
    COUNT(*) FILTER (WHERE a.status IN ('present','late')) * 100.0
    / NULLIF(COUNT(*), 0), 2
  )                                               AS attendance_pct
FROM erp.attendance_sessions sess
JOIN erp.attendance a ON a.session_id = sess.id
GROUP BY a.student_id, sess.subject_id, sess.batch_id;
