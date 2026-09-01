ALTER TABLE questions ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'medium';
CREATE TABLE IF NOT EXISTS student_favorites (student_id INTEGER NOT NULL,question_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(student_id,question_id),FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_favorites_student ON student_favorites(student_id,created_at);
