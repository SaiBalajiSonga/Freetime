-- Run this script in the Supabase SQL Editor to create the JEE Leaderboard RPC

CREATE OR REPLACE FUNCTION public.get_jee_leaderboard(p_weekly_exam_id UUID)
RETURNS TABLE (
  rank bigint,
  id uuid,
  user_id uuid,
  score integer,
  correct integer,
  incorrect integer,
  time_taken integer,
  name text,
  math_score integer,
  physics_score integer,
  chem_score integer,
  math_incorrect integer,
  physics_incorrect integer,
  chem_incorrect integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    RANK() OVER (
      ORDER BY 
        ts.score DESC NULLS LAST,
        (ts.config->'subject_scores'->'Mathematics'->>'score')::int DESC NULLS LAST,
        (ts.config->'subject_scores'->'Physics'->>'score')::int DESC NULLS LAST,
        (ts.config->'subject_scores'->'Chemistry'->>'score')::int DESC NULLS LAST,
        -- Less proportion of negative marks overall: incorrect / NULLIF((correct+incorrect), 0) ASC
        (ts.incorrect::float / NULLIF(ts.correct + ts.incorrect, 0)) ASC NULLS LAST,
        ((ts.config->'subject_scores'->'Mathematics'->>'incorrect')::float / NULLIF((ts.config->'subject_scores'->'Mathematics'->>'correct')::int + (ts.config->'subject_scores'->'Mathematics'->>'incorrect')::int, 0)) ASC NULLS LAST,
        ((ts.config->'subject_scores'->'Physics'->>'incorrect')::float / NULLIF((ts.config->'subject_scores'->'Physics'->>'correct')::int + (ts.config->'subject_scores'->'Physics'->>'incorrect')::int, 0)) ASC NULLS LAST,
        ((ts.config->'subject_scores'->'Chemistry'->>'incorrect')::float / NULLIF((ts.config->'subject_scores'->'Chemistry'->>'correct')::int + (ts.config->'subject_scores'->'Chemistry'->>'incorrect')::int, 0)) ASC NULLS LAST
    ) as rank,
    ts.id,
    ts.user_id,
    ts.score,
    ts.correct,
    ts.incorrect,
    ts.time_taken,
    p.name,
    COALESCE((ts.config->'subject_scores'->'Mathematics'->>'score')::int, 0) as math_score,
    COALESCE((ts.config->'subject_scores'->'Physics'->>'score')::int, 0) as physics_score,
    COALESCE((ts.config->'subject_scores'->'Chemistry'->>'score')::int, 0) as chem_score,
    COALESCE((ts.config->'subject_scores'->'Mathematics'->>'incorrect')::int, 0) as math_incorrect,
    COALESCE((ts.config->'subject_scores'->'Physics'->>'incorrect')::int, 0) as physics_incorrect,
    COALESCE((ts.config->'subject_scores'->'Chemistry'->>'incorrect')::int, 0) as chem_incorrect
  FROM public.test_sessions ts
  LEFT JOIN public.profiles p ON ts.user_id = p.id
  WHERE ts.weekly_exam_id = p_weekly_exam_id
    AND ts.status = 'submitted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
