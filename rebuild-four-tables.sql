-- Planned rebuild for mu50. Apply only after the verified backup.
-- Final application tables: users, questions, attempts, messages.

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  phone TEXT,
  school_year TEXT,
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
  lesson TEXT NOT NULL,
  school_year TEXT,
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
