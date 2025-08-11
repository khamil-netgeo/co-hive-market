-- 1) Enums and helper functions
DO $$ BEGIN
  CREATE TYPE public.community_join_mode AS ENUM ('open','approval','invite');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_post_visibility AS ENUM ('public','members');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_rsvp_status AS ENUM ('going','interested','not_going');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: is_member_of_community
CREATE OR REPLACE FUNCTION public.is_member_of_community(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = _community_id AND cm.user_id = _user_id
  );
$$;

-- 2) Alter communities: join_mode, slug, branding
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS join_mode public.community_join_mode NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text;

-- 3) Join requests table
CREATE TABLE IF NOT EXISTS public.community_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, canceled
  message text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

-- Touch updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER trg_cjr_updated_at
  BEFORE UPDATE ON public.community_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policies for join requests
-- Requester can insert/select/update own (only to cancel when pending)
CREATE POLICY IF NOT EXISTS "Requester insert own join request" ON public.community_join_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Requester view own join requests" ON public.community_join_requests
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Requester cancel own pending request" ON public.community_join_requests
FOR UPDATE USING (user_id = auth.uid() AND status = 'pending') WITH CHECK (user_id = auth.uid());

-- Managers/Admins can view/manage requests for their community
CREATE POLICY IF NOT EXISTS "Managers view community requests" ON public.community_join_requests
FOR SELECT USING (
  public.is_manager_of_community(community_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY IF NOT EXISTS "Managers decide community requests" ON public.community_join_requests
FOR UPDATE USING (
  public.is_manager_of_community(community_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
) WITH CHECK (true);

-- 4) Community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  media_urls text[],
  visibility public.community_post_visibility NOT NULL DEFAULT 'members',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER trg_cp_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS: view
CREATE POLICY IF NOT EXISTS "Public view public posts" ON public.community_posts
FOR SELECT USING (
  visibility = 'public'
);
CREATE POLICY IF NOT EXISTS "Members view member posts" ON public.community_posts
FOR SELECT USING (
  visibility = 'members' AND public.is_member_of_community(community_id, auth.uid())
);

-- RLS: create/update/delete
CREATE POLICY IF NOT EXISTS "Members create posts" ON public.community_posts
FOR INSERT WITH CHECK (
  public.is_member_of_community(community_id, auth.uid()) AND author_user_id = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Authors update own posts" ON public.community_posts
FOR UPDATE USING (author_user_id = auth.uid()) WITH CHECK (author_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins manage posts" ON public.community_posts
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role'))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- 5) Community events
CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  location_text text,
  is_online boolean NOT NULL DEFAULT false,
  cover_url text,
  visibility public.community_post_visibility NOT NULL DEFAULT 'members',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER trg_ce_updated_at
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- View events
CREATE POLICY IF NOT EXISTS "Public view public events" ON public.community_events
FOR SELECT USING (visibility = 'public');

CREATE POLICY IF NOT EXISTS "Members view member events" ON public.community_events
FOR SELECT USING (visibility = 'members' AND public.is_member_of_community(community_id, auth.uid()));

-- Create/update/delete by managers/admins
CREATE POLICY IF NOT EXISTS "Managers create events" ON public.community_events
FOR INSERT WITH CHECK (
  public.is_manager_of_community(community_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY IF NOT EXISTS "Managers update events" ON public.community_events
FOR UPDATE USING (
  public.is_manager_of_community(community_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
) WITH CHECK (
  public.is_manager_of_community(community_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY IF NOT EXISTS "Managers delete events" ON public.community_events
FOR DELETE USING (
  public.is_manager_of_community(community_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- 6) Event RSVPs
CREATE TABLE IF NOT EXISTS public.community_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status public.event_rsvp_status NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.community_event_rsvps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER trg_cer_updated_at
  BEFORE UPDATE ON public.community_event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RSVP policies: users manage own RSVP if they can view the event
CREATE OR REPLACE FUNCTION public.can_view_event(_event_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_events e
    WHERE e.id = _event_id
      AND (
        e.visibility = 'public'
        OR public.is_member_of_community(e.community_id, _user_id)
      )
  );
$$;

CREATE POLICY IF NOT EXISTS "Users view own RSVPs" ON public.community_event_rsvps
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users upsert own RSVP" ON public.community_event_rsvps
FOR INSERT WITH CHECK (user_id = auth.uid() AND public.can_view_event(event_id, auth.uid()));

CREATE POLICY IF NOT EXISTS "Users update own RSVP" ON public.community_event_rsvps
FOR UPDATE USING (user_id = auth.uid() AND public.can_view_event(event_id, auth.uid()))
WITH CHECK (user_id = auth.uid());

-- 7) Foreign keys (no cross-schema refs besides public)
DO $$ BEGIN
  ALTER TABLE public.community_join_requests
    ADD CONSTRAINT cjr_community_fk FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_posts
    ADD CONSTRAINT cp_community_fk FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_events
    ADD CONSTRAINT ce_community_fk FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.community_event_rsvps
    ADD CONSTRAINT cer_event_fk FOREIGN KEY (event_id) REFERENCES public.community_events(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
