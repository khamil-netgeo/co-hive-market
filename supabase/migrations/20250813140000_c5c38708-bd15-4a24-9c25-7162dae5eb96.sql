-- Create table to store shipment details linked to orders
CREATE TABLE IF NOT EXISTS public.order_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'easyparcel', 'rider'
  courier_name TEXT,
  service_name TEXT,
  etd_text TEXT,
  shipping_cents INTEGER,
  tracking_no TEXT,
  label_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id ON public.order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_tracking_no ON public.order_shipments(tracking_no);

-- Policies
-- View related shipments (buyer, vendor owner, or admins)
CREATE POLICY "View related shipments"
ON public.order_shipments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_shipments.order_id
      AND (
        o.buyer_user_id = auth.uid()
        OR v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

-- System can insert shipments (edge functions / service role)
CREATE POLICY "System can insert shipments"
ON public.order_shipments
FOR INSERT
WITH CHECK (true);

-- Vendors or admins can update shipments
CREATE POLICY "Vendors/admins update shipments"
ON public.order_shipments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_shipments.order_id
      AND (
        v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_shipments.order_id
      AND (
        v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

-- Admins can delete shipments
CREATE POLICY "Admins delete shipments"
ON public.order_shipments
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_order_shipments_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_order_shipments_updated_at
    BEFORE UPDATE ON public.order_shipments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;