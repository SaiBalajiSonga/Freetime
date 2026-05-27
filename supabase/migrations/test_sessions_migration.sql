-- ============================================================
-- Migration: Test Sessions
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Table: test_sessions ─────────────────────────────────────
CREATE TABLE public.test_sessions (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mode            text NOT NULL CHECK (mode IN ('custom', 'jee_mains')),
  config          jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  submitted_at    timestamptz,
  score           integer,
  max_score       integer,
  total_questions integer,
  correct         integer,
  incorrect       integer,
  unattempted     integer,
  time_taken      integer,  -- seconds
  time_limit_minutes integer NOT NULL DEFAULT 60,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Table: test_session_questions ────────────────────────────
CREATE TABLE public.test_session_questions (
  id                    uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id            uuid REFERENCES public.test_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id           uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  order_index           integer NOT NULL,
  answer_given          text,          -- NULL = unattempted
  is_correct            boolean,
  marks_awarded         integer NOT NULL DEFAULT 0,
  is_marked_for_review  boolean NOT NULL DEFAULT false,
  visit_status          text NOT NULL DEFAULT 'not_visited'
                          CHECK (visit_status IN (
                            'not_visited', 'not_answered', 'answered',
                            'marked', 'answered_marked'
                          )),
  time_taken            integer NOT NULL DEFAULT 0,  -- seconds on this question
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_test_session_questions_session_order
  ON public.test_session_questions (session_id, order_index);

CREATE INDEX idx_test_sessions_user_id
  ON public.test_sessions (user_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.test_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_session_questions ENABLE ROW LEVEL SECURITY;

-- test_sessions policies
CREATE POLICY "Users can view own test sessions"
  ON public.test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test sessions"
  ON public.test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions"
  ON public.test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- test_session_questions policies
CREATE POLICY "Users can view own session questions"
  ON public.test_session_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions ts
      WHERE ts.id = session_id AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session questions"
  ON public.test_session_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_sessions ts
      WHERE ts.id = session_id AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session questions"
  ON public.test_session_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions ts
      WHERE ts.id = session_id AND ts.user_id = auth.uid()
    )
  );
