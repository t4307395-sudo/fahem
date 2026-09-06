-- Fahem production schema: four application tables.
-- Questions and answer choices are stored together. Student history and support messages are JSON-backed.

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  phone TEXT,
  school_year TEXT,
  educational_stage TEXT,
  subjects_json TEXT NOT NULL DEFAULT '[]',
  stats_json TEXT NOT NULL DEFAULT '{}',
  settings_json TEXT NOT NULL DEFAULT '{}',
  favorites_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT
);

CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'الوحدة الأولى',
  lesson TEXT NOT NULL,
  school_year TEXT,
  educational_stage TEXT,
  type TEXT NOT NULL CHECK(type IN ('mcq','boolean','essay')),
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_answer TEXT,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('practice','mock','mistakes')),
  scope_type TEXT,
  scope_key TEXT,
  scope_label TEXT,
  answers_json TEXT NOT NULL DEFAULT '{}',
  scores_json TEXT NOT NULL DEFAULT '{}',
  score REAL DEFAULT 0,
  total_gradable INTEGER DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('contact','question_report','password_reset')),
  sender_user_id INTEGER,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  question_id INTEGER,
  question_snapshot_json TEXT NOT NULL DEFAULT '{}',
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Editable schoolbook curriculum tree. Existing databases should apply phase8_schoolbook_content.sql.
CREATE TABLE content_nodes (
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
CREATE UNIQUE INDEX idx_content_nodes_parent_slug ON content_nodes(parent_id, slug);
CREATE INDEX idx_content_nodes_type_parent ON content_nodes(node_type, parent_id, sort_order);

CREATE TABLE content_assessments (
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
CREATE UNIQUE INDEX idx_content_assessments_node ON content_assessments(node_type, node_id);

CREATE TABLE assessment_questions (
  assessment_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (assessment_id, question_id)
);
