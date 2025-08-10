-- Phase 3 (part 1): Likes feature for Feed
-- Reuse existing enum 'review_target' for target_type ('product'|'service')

-- 1) Core table to store likes
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type public.review_target NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_likes_user_target_unique UNIQUE (user_id, target_type, target_id)
);

-- Helpful index for summary joins
CREATE INDEX IF NOT EXISTS feed_likes_target_idx ON public.feed_likes (target_type, target_id);

-- Enable RLS and set tight policies: users can manage their own likes only
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feed_likes' AND policyname = 'Users select own likes'
  ) THEN
    CREATE POLICY "Users select own likes"
    ON public.feed_likes
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feed_likes' AND policyname = 'Users insert own likes'
  ) THEN
    CREATE POLICY "Users insert own likes"
    ON public.feed_likes
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feed_likes' AND policyname = 'Users delete own likes'
  ) THEN
    CREATE POLICY "Users delete own likes"
    ON public.feed_likes
    FOR DELETE
    USING (user_id = auth.uid());
  END IF;
END $$;

-- 2) Summary table for public counts (fast read for everyone)
CREATE TABLE IF NOT EXISTS public.feed_like_summary (
  target_type public.review_target NOT NULL,
  target_id uuid NOT NULL,
  like_count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (target_type, target_id)
);

-- Keep RLS disabled on summary so that triggers can update and everyone can read counts
ALTER TABLE public.feed_like_summary DISABLE ROW LEVEL SECURITY;

-- 3) Trigger to keep summary in sync
CREATE OR REPLACE FUNCTION public.update_feed_like_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.feed_like_summary (target_type, target_id, like_count)
    VALUES (NEW.target_type, NEW.target_id, 1)
    ON CONFLICT (target_type, target_id)
    DO UPDATE SET like_count = public.feed_like_summary.like_count + 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_like_summary
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
  END IF;
  RETURN NULL;
END;$$;

DROP TRIGGER IF EXISTS trg_feed_like_summary_ins ON public.feed_likes;
DROP TRIGGER IF EXISTS trg_feed_like_summary_del ON public.feed_likes;

CREATE TRIGGER trg_feed_like_summary_ins
AFTER INSERT ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION public.update_feed_like_summary();

CREATE TRIGGER trg_feed_like_summary_del
AFTER DELETE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION public.update_feed_like_summary();