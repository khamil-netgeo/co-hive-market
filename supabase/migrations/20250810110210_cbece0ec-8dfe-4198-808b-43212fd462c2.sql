-- Fix security linter: enable RLS on summary and allow public read
ALTER TABLE public.feed_like_summary ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feed_like_summary' AND policyname = 'Public can read like summary'
  ) THEN
    CREATE POLICY "Public can read like summary"
    ON public.feed_like_summary
    FOR SELECT
    USING (true);
  END IF;
END $$;