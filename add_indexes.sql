-- Add this to your Supabase SQL editor to create indexes for 10K+ questions

CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_visibility ON questions(visibility);
CREATE INDEX IF NOT EXISTS idx_questions_hash ON questions(hash);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON questions(chapter_id);

-- Optional: enable pg_trgm for fast LIKE/ILIKE searches on statement
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_questions_statement_trgm ON questions USING gin(statement gin_trgm_ops);
