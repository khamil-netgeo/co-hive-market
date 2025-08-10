-- Create table for order progress events
CREATE TABLE IF NOT EXISTS public.order_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  event TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ope_order_id ON public.order_progress_events(order_id);
CREATE INDEX IF NOT EXISTS idx_ope_created_at ON public.order_progress_events(created_at);

-- Enable RLS
ALTER TABLE public.order_progress_events ENABLE ROW LEVEL SECURITY;

-- Allow reading events for related users (buyer, vendor owner, assigned rider, admins)
CREATE POLICY "Read related order events" ON public.order_progress_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    LEFT JOIN public.vendors v ON v.id = o.vendor_id
    LEFT JOIN public.deliveries d ON d.order_id = o.id
    WHERE o.id = order_progress_events.order_id
      AND (
        o.buyer_user_id = auth.uid()
        OR v.user_id = auth.uid()
        OR d.rider_user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::public.app_role)
        OR has_role(auth.uid(), 'superadmin'::public.app_role)
      )
  )
);

-- Allow inserting events by related users
CREATE POLICY "Insert related order events" ON public.order_progress_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    LEFT JOIN public.vendors v ON v.id = o.vendor_id
    LEFT JOIN public.deliveries d ON d.order_id = o.id
    WHERE o.id = order_progress_events.order_id
      AND (
        o.buyer_user_id = auth.uid()
        OR v.user_id = auth.uid()
        OR d.rider_user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::public.app_role)
        OR has_role(auth.uid(), 'superadmin'::public.app_role)
      )
  )
);

-- No updates/deletes by default (admins can use SQL if needed)
