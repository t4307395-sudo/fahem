-- Schoolbook content model: one editable tree for administration and explicit lesson/unit assessments.
CREATE TABLE IF NOT EXISTS content_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_type TEXT NOT NULL CHECK(node_type IN ('stage','year','subject','unit','lesson')),
  parent_id INTEGER,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_nodes_parent_slug ON content_nodes(parent_id, slug);
CREATE INDEX IF NOT EXISTS idx_content_nodes_type_parent ON content_nodes(node_type, parent_id, sort_order);

CREATE TABLE IF NOT EXISTS content_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_type TEXT NOT NULL CHECK(node_type IN ('lesson','unit')),
  node_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_assessments_node ON content_assessments(node_type, node_id);

CREATE TABLE IF NOT EXISTS assessment_questions (
  assessment_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (assessment_id, question_id)
);

ALTER TABLE questions ADD COLUMN lesson_node_id INTEGER;
ALTER TABLE questions ADD COLUMN is_published INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_questions_lesson_node ON questions(lesson_node_id, is_published);
