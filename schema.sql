PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_seen_at TEXT);
CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS chapters (id INTEGER PRIMARY KEY AUTOINCREMENT,subject_id INTEGER NOT NULL,name TEXT NOT NULL,UNIQUE(subject_id,name),FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT,subject_id INTEGER NOT NULL,chapter_id INTEGER NOT NULL,type TEXT NOT NULL CHECK(type IN ('mcq','boolean','essay')),prompt TEXT NOT NULL,options_json TEXT NOT NULL DEFAULT '[]',correct_answer TEXT,explanation TEXT,difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT,FOREIGN KEY(subject_id) REFERENCES subjects(id),FOREIGN KEY(chapter_id) REFERENCES chapters(id));
CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('practice','mock','mistakes')),started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT,score REAL DEFAULT 0,total_gradable INTEGER DEFAULT 0,FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS attempt_answers (id INTEGER PRIMARY KEY AUTOINCREMENT,attempt_id INTEGER NOT NULL,question_id INTEGER NOT NULL,answer_text TEXT,automatic_correct INTEGER,teacher_score REAL,feedback TEXT,FOREIGN KEY(attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,FOREIGN KEY(question_id) REFERENCES questions(id));
CREATE INDEX IF NOT EXISTS idx_questions_subject_chapter ON questions(subject_id,chapter_id);
-- تتم إضافة difficulty إلى الأسئلة الموجودة عبر migration منفصل إذا كان الجدول قد أُنشئ سابقًا.

CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id,completed_at);
CREATE INDEX IF NOT EXISTS idx_answers_question ON attempt_answers(question_id);
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS student_favorites (student_id INTEGER NOT NULL,question_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(student_id,question_id),FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_favorites_student ON student_favorites(student_id,created_at);
INSERT OR IGNORE INTO app_settings(key,value) VALUES ('exam_duration_seconds','900');
-- حساب المعلم الأولي: غيّر كلمة المرور بعد التنفيذ. password_hash يجب أن يكون SHA-256 hex.
-- INSERT INTO teachers(email,password_hash,name) VALUES ('teacher@gmail.com','ضع_هاش_كلمة_المرور','المعلم');
