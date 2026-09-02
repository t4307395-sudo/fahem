-- Run once against the existing D1 database after verifying the column is absent.
ALTER TABLE students ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
