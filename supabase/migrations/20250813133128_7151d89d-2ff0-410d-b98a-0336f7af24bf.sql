-- Create order_shipments table to store courier details per order
CREATE TABLE IF NOT EXISTS public.order_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g., 'easyparcel'
  courier_code TEXT,
  courier_name TEXT,
  service_code TEXT,
  service_name TEXT,
  etd_text TEXT,
  shipping_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'myr',
  tracking_no TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

-- Policies: buyers and vendors can view shipments of their orders; admins/superadmins can view all
CREATE POLICY "Buyers view own order shipments" ON public.order_shipments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.buyer_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors/admins view related order shipments" ON public.order_shipments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_shipments.order_id AND (
      v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
    )
  )
);

-- Restrict writes to trusted code (service role bypasses RLS). Allow admins as backup.
CREATE POLICY "Admins insert shipments" ON public.order_shipments
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Admins update shipments" ON public.order_shipments
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_order_shipments_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_order_shipments_updated_at
    BEFORE UPDATE ON public.order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_order_shipments_order ON public.order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_provider ON public.order_shipments(provider);
