-- ============================================================
-- Migration 005: Marks and Grading
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================
SET search_path TO erp, public;

-- EXAM TYPES (e.g. Mid-Term, End-Term, Assignment, Practical)
CREATE TABLE IF NOT EXISTS erp.exam_types (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT  NOT NULL UNIQUE,
  max_marks    NUMERIC(5,2) NOT NULL,
  weight_pct   NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_exam_max_marks CHECK (max_marks > 0),
  CONSTRAINT chk_exam_weight CHECK (weight_pct BETWEEN 0 AND 100)
);

-- MARKS ENTRY
CREATE TABLE IF NOT EXISTS erp.marks (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID    NOT NULL REFERENCES erp.students(id) ON DELETE RESTRICT,
  subject_id    UUID    NOT NULL REFERENCES erp.subjects(id) ON DELETE RESTRICT,
  exam_type_id  UUID    NOT NULL REFERENCES erp.exam_types(id) ON DELETE RESTRICT,
  batch_id      UUID    NOT NULL REFERENCES erp.batches(id) ON DELETE RESTRICT,
  marks_obtained NUMERIC(5,2) NOT NULL,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  entered_by    UUID    REFERENCES erp.faculty(id),
  entered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_marks_student_subject_exam UNIQUE (student_id, subject_id, exam_type_id, batch_id),
  CONSTRAINT chk_marks_non_negative CHECK (marks_obtained >= 0)
);

CREATE INDEX IF NOT EXISTS idx_marks_student ON erp.marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject ON erp.marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_published ON erp.marks(is_published);

DROP TRIGGER IF EXISTS trg_marks_updated_at ON erp.marks;
CREATE TRIGGER trg_marks_updated_at
  BEFORE UPDATE ON erp.marks
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- Function: validate marks_obtained <= max_marks from exam_type
CREATE OR REPLACE FUNCTION erp.fn_validate_marks()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_max NUMERIC;
BEGIN
  SELECT max_marks INTO v_max FROM erp.exam_types WHERE id = NEW.exam_type_id;
  IF NEW.marks_obtained > v_max THEN
    RAISE EXCEPTION 'marks_obtained (%) exceeds max_marks (%) for this exam type', NEW.marks_obtained, v_max;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_marks ON erp.marks;
CREATE TRIGGER trg_validate_marks
  BEFORE INSERT OR UPDATE ON erp.marks
  FOR EACH ROW EXECUTE FUNCTION erp.fn_validate_marks();

-- 10-point grading scale function
CREATE OR REPLACE FUNCTION erp.fn_grade_point(pct NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF pct >= 90 THEN RETURN 10;
  ELSIF pct >= 80 THEN RETURN 9;
  ELSIF pct >= 70 THEN RETURN 8;
  ELSIF pct >= 60 THEN RETURN 7;
  ELSIF pct >= 50 THEN RETURN 6;
  ELSIF pct >= 45 THEN RETURN 5;
  ELSIF pct >= 40 THEN RETURN 4;
  ELSE RETURN 0;
  END IF;
END;
$$;

-- VIEW: SGPA per student per batch semester
CREATE OR REPLACE VIEW erp.v_sgpa AS
SELECT
  m.student_id,
  m.batch_id,
  sub.semester,
  ROUND(
    SUM(erp.fn_grade_point(m.marks_obtained * 100.0 / et.max_marks) * sub.credits)
    / NULLIF(SUM(sub.credits), 0),
  2) AS sgpa,
  SUM(sub.credits) AS total_credits
FROM erp.marks m
JOIN erp.subjects sub ON sub.id = m.subject_id
JOIN erp.exam_types et ON et.id = m.exam_type_id
WHERE m.is_published = TRUE
GROUP BY m.student_id, m.batch_id, sub.semester;
