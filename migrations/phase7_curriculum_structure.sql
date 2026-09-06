-- Curriculum-first student experience.
-- Safe additive migration for existing Fahem databases.
ALTER TABLE users ADD COLUMN educational_stage TEXT;
ALTER TABLE questions ADD COLUMN unit TEXT NOT NULL DEFAULT 'الوحدة الأولى';
ALTER TABLE questions ADD COLUMN educational_stage TEXT;
ALTER TABLE attempts ADD COLUMN scope_type TEXT;
ALTER TABLE attempts ADD COLUMN scope_key TEXT;
ALTER TABLE attempts ADD COLUMN scope_label TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_curriculum
  ON questions(educational_stage, school_year, subject, unit, lesson);

-- Existing questions keep their lesson as the closest available grouping.
UPDATE questions
SET unit = CASE WHEN trim(lesson) <> '' THEN lesson ELSE 'الوحدة الأولى' END
WHERE unit IS NULL OR trim(unit) = '';
