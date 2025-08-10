-- 1) Chat read states table for unread counts & read receipts
CREATE TABLE IF NOT EXISTS public.chat_read_states (
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

ALTER TABLE public.chat_read_states ENABLE ROW LEVEL SECURITY;

-- RLS: Users can upsert/select their own read state only if they are thread participants or admins
CREATE POLICY IF NOT EXISTS "Participants manage own read state"
ON public.chat_read_states
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_threads ct
    LEFT JOIN public.vendors v ON v.id = ct.vendor_id
    WHERE ct.id = chat_read_states.thread_id
      AND (ct.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'))
  )
);

CREATE POLICY IF NOT EXISTS "Participants update own read state"
ON public.chat_read_states
FOR UPDATE
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_threads ct
    LEFT JOIN public.vendors v ON v.id = ct.vendor_id
    WHERE ct.id = chat_read_states.thread_id
      AND (ct.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'))
  )
)
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Participants view read states"
ON public.chat_read_states
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_threads ct
    LEFT JOIN public.vendors v ON v.id = ct.vendor_id
    WHERE ct.id = chat_read_states.thread_id
      AND (ct.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'))
  )
);

-- Trigger to maintain updated_at
CREATE OR REPLACE TRIGGER trg_update_chat_read_states_updated_at
BEFORE UPDATE ON public.chat_read_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_chat_read_states_user ON public.chat_read_states (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_states_thread ON public.chat_read_states (thread_id);

-- 2) Storage for chat attachments
-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files','chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Permissions for chat attachments: participants can select and insert
-- SELECT policy
CREATE POLICY IF NOT EXISTS "Chat participants read files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-files' AND EXISTS (
    SELECT 1 FROM public.chat_threads ct
    LEFT JOIN public.vendors v ON v.id = ct.vendor_id
    WHERE ct.id = ((storage.foldername(name))[1])::uuid
      AND (ct.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'))
  )
);

-- INSERT policy
CREATE POLICY IF NOT EXISTS "Chat participants upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND EXISTS (
    SELECT 1 FROM public.chat_threads ct
    LEFT JOIN public.vendors v ON v.id = ct.vendor_id
    WHERE ct.id = ((storage.foldername(name))[1])::uuid
      AND (ct.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'))
  )
);

-- Optional: allow participants to delete their own uploads
CREATE POLICY IF NOT EXISTS "Chat participants delete files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-files' AND EXISTS (
    SELECT 1 FROM public.chat_threads ct
    LEFT JOIN public.vendors v ON v.id = ct.vendor_id
    WHERE ct.id = ((storage.foldername(name))[1])::uuid
      AND (ct.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'))
  )
);
