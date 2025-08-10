-- Chat and Support schema for buyer-seller messaging and support center

-- Chat threads table
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  buyer_user_id uuid,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  subject text,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz,
  last_message_preview text
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Participants and admins can view chat threads"
ON public.chat_threads
FOR SELECT
USING (
  (buyer_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chat_threads.vendor_id AND v.user_id = auth.uid())
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
);

CREATE POLICY IF NOT EXISTS "Participants and admins can insert chat threads"
ON public.chat_threads
FOR INSERT
WITH CHECK (
  (buyer_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chat_threads.vendor_id AND v.user_id = auth.uid())
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
);

CREATE POLICY IF NOT EXISTS "Participants and admins can update chat threads"
ON public.chat_threads
FOR UPDATE
USING (
  (buyer_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chat_threads.vendor_id AND v.user_id = auth.uid())
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
)
WITH CHECK (
  (buyer_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = chat_threads.vendor_id AND v.user_id = auth.uid())
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
);

CREATE POLICY IF NOT EXISTS "Admins can delete chat threads"
ON public.chat_threads
FOR DELETE
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'));

CREATE TRIGGER IF NOT EXISTS trg_chat_threads_updated_at
BEFORE UPDATE ON public.chat_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer ON public.chat_threads (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_vendor ON public.chat_threads (vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_last_msg ON public.chat_threads (last_message_at DESC);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  body text,
  message_type text NOT NULL DEFAULT 'text',
  file_url text
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Participants can view chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_threads ct
    WHERE ct.id = chat_messages.thread_id AND (
      ct.buyer_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = ct.vendor_id AND v.user_id = auth.uid())
      OR has_role(auth.uid(),'admin')
      OR has_role(auth.uid(),'superadmin')
    )
  )
);

CREATE POLICY IF NOT EXISTS "Participants can insert chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_threads ct
    WHERE ct.id = chat_messages.thread_id AND (
      ct.buyer_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = ct.vendor_id AND v.user_id = auth.uid())
      OR has_role(auth.uid(),'admin')
      OR has_role(auth.uid(),'superadmin')
    )
  )
);

CREATE POLICY IF NOT EXISTS "Admins can delete chat messages"
ON public.chat_messages
FOR DELETE
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'superadmin'));

CREATE OR REPLACE FUNCTION public.on_chat_message_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.chat_threads
  SET last_message_at = NOW(),
      last_message_preview = COALESCE(LEFT(NEW.body, 160), last_message_preview),
      updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_chat_message_insert ON public.chat_messages;
CREATE TRIGGER trg_chat_message_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.on_chat_message_insert();

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages (thread_id, created_at);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  category text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  assigned_to uuid
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Owner vendor or admins can view tickets"
ON public.support_tickets
FOR SELECT
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = support_tickets.vendor_id AND v.user_id = auth.uid())
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
);

CREATE POLICY IF NOT EXISTS "Users create own tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Owner updates own ticket or admins"
ON public.support_tickets
FOR UPDATE
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
)
WITH CHECK (
  created_by = auth.uid()
  OR has_role(auth.uid(),'admin')
  OR has_role(auth.uid(),'superadmin')
);

CREATE TRIGGER IF NOT EXISTS trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets (created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_vendor ON public.support_tickets (vendor_id);

-- Support messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "View messages for your tickets"
ON public.support_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (
        t.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = t.vendor_id AND v.user_id = auth.uid())
        OR has_role(auth.uid(),'admin')
        OR has_role(auth.uid(),'superadmin')
      )
  )
  AND (
    internal = false
    OR has_role(auth.uid(),'admin')
    OR has_role(auth.uid(),'superadmin')
  )
);

CREATE POLICY IF NOT EXISTS "Insert messages on your tickets"
ON public.support_messages
FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (
        t.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = t.vendor_id AND v.user_id = auth.uid())
        OR has_role(auth.uid(),'admin')
        OR has_role(auth.uid(),'superadmin')
      )
  )
  AND (
    internal = false
    OR has_role(auth.uid(),'admin')
    OR has_role(auth.uid(),'superadmin')
  )
);

CREATE OR REPLACE FUNCTION public.on_support_message_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_support_message_insert ON public.support_messages;
CREATE TRIGGER trg_support_message_insert
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.on_support_message_insert();