-- Phase 3 (part 2): Watch analytics events for Feed

CREATE TABLE IF NOT EXISTS public.feed_watch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  target_type public.review_target NOT NULL,
  target_id uuid NOT NULL,
  session_id text NOT NULL,
  watched_ms integer NOT NULL CHECK (watched_ms >= 0),
  vendor_id uuid NULL,
  community_id uuid NULL,
  source text NOT NULL DEFAULT 'feed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS feed_watch_events_target_idx ON public.feed_watch_events (target_type, target_id);
CREATE INDEX IF NOT EXISTS feed_watch_events_created_idx ON public.feed_watch_events (created_at);
CREATE INDEX IF NOT EXISTS feed_watch_events_session_idx ON public.feed_watch_events (session_id);

-- RLS: allow anonymous/user inserts, restrict reads to admins/superadmins
ALTER TABLE public.feed_watch_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feed_watch_events' AND policyname = 'Anyone can insert watch events'
  ) THEN
    CREATE POLICY "Anyone can insert watch events"
    ON public.feed_watch_events
    FOR INSERT
    WITH CHECK (
      -- Guests or logged-in users
      user_id IS NULL OR user_id = auth.uid()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feed_watch_events' AND policyname = 'Admins can read watch events'
  ) THEN
    CREATE POLICY "Admins can read watch events"
    ON public.feed_watch_events
    FOR SELECT
    USING (
      has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;
END $$;