-- Fix: Remove IF NOT EXISTS for CREATE POLICY (not supported)

-- Add stripe_session_id column to orders if missing
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

-- Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_user_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Policies for deliveries
CREATE POLICY "View related deliveries"
ON public.deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    LEFT JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = deliveries.order_id
      AND (
        o.buyer_user_id = auth.uid()
        OR v.user_id = auth.uid()
        OR deliveries.rider_user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

CREATE POLICY "Vendors or admins create deliveries"
ON public.deliveries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = deliveries.order_id
      AND (
        v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

CREATE POLICY "Update deliveries (rider/vendor/admin)"
ON public.deliveries
FOR UPDATE
USING (
  deliveries.rider_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = deliveries.order_id
      AND (
        v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
)
WITH CHECK (
  deliveries.rider_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = deliveries.order_id
      AND (
        v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

CREATE POLICY "Admins manage deliveries"
ON public.deliveries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();