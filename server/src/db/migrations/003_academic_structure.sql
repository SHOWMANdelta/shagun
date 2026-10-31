-- ============================================================
-- Migration 003: Academic Structure
-- Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
-- ============================================================
SET search_path TO erp, public;

-- PROGRAMS (e.g. BCA, BBA, BSc)
CREATE TABLE IF NOT EXISTS erp.programs (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT  NOT NULL UNIQUE,
  name         TEXT  NOT NULL,
  total_semesters INTEGER NOT NULL DEFAULT 6,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_programs_semesters CHECK (total_semesters BETWEEN 2 AND 12)
);

DROP TRIGGER IF EXISTS trg_programs_updated_at ON erp.programs;
CREATE TRIGGER trg_programs_updated_at
  BEFORE UPDATE ON erp.programs
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- BATCHES (e.g. BCA-2024-2027)
CREATE TABLE IF NOT EXISTS erp.batches (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID    NOT NULL REFERENCES erp.programs(id) ON DELETE RESTRICT,
  name         TEXT    NOT NULL,
  start_year   INTEGER NOT NULL,
  end_year     INTEGER NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_batches_year CHECK (end_year > start_year),
  CONSTRAINT uq_batches_program_name UNIQUE (program_id, name)
);

CREATE INDEX IF NOT EXISTS idx_batches_program_id ON erp.batches(program_id);

DROP TRIGGER IF EXISTS trg_batches_updated_at ON erp.batches;
CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON erp.batches
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- SUBJECTS
CREATE TABLE IF NOT EXISTS erp.subjects (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID    NOT NULL REFERENCES erp.programs(id) ON DELETE RESTRICT,
  code         TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  semester     INTEGER NOT NULL,
  credits      NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_subjects_semester CHECK (semester BETWEEN 1 AND 12),
  CONSTRAINT chk_subjects_credits CHECK (credits > 0)
);

CREATE INDEX IF NOT EXISTS idx_subjects_program_semester ON erp.subjects(program_id, semester);

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON erp.subjects;
CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON erp.subjects
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- STUDENTS (profile extending users)
CREATE TABLE IF NOT EXISTS erp.students (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID  NOT NULL UNIQUE REFERENCES erp.users(id) ON DELETE RESTRICT,
  batch_id        UUID  NOT NULL REFERENCES erp.batches(id) ON DELETE RESTRICT,
  enrollment_no   TEXT  NOT NULL UNIQUE,
  current_semester INTEGER NOT NULL DEFAULT 1,
  dob             DATE,
  phone           TEXT,
  address         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_students_semester CHECK (current_semester BETWEEN 1 AND 12)
);

CREATE INDEX IF NOT EXISTS idx_students_batch_id ON erp.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON erp.students(enrollment_no);

DROP TRIGGER IF EXISTS trg_students_updated_at ON erp.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON erp.students
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- FACULTY (profile extending users)
CREATE TABLE IF NOT EXISTS erp.faculty (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID  NOT NULL UNIQUE REFERENCES erp.users(id) ON DELETE RESTRICT,
  employee_code   TEXT  NOT NULL UNIQUE,
  department      TEXT,
  designation     TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faculty_employee_code ON erp.faculty(employee_code);

DROP TRIGGER IF EXISTS trg_faculty_updated_at ON erp.faculty;
CREATE TRIGGER trg_faculty_updated_at
  BEFORE UPDATE ON erp.faculty
  FOR EACH ROW EXECUTE FUNCTION erp.fn_set_updated_at();

-- FACULTY SUBJECT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS erp.faculty_subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id  UUID NOT NULL REFERENCES erp.faculty(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES erp.subjects(id) ON DELETE RESTRICT,
  batch_id    UUID NOT NULL REFERENCES erp.batches(id) ON DELETE RESTRICT,
  academic_year TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_faculty_subject_batch_year UNIQUE (faculty_id, subject_id, batch_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_faculty_subjects_faculty ON erp.faculty_subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_subjects_subject ON erp.faculty_subjects(subject_id);
