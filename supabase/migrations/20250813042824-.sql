-- 1) Allow public read of active vendors so shoppers can see vendor names
DO $$ BEGIN
  -- Enable RLS if not already enabled
  PERFORM 1 FROM pg_tables WHERE schemaname='public' AND tablename='vendors';
END $$;

-- Add a safe SELECT policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'vendors' AND policyname = 'Public can read active vendors'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Public can read active vendors"
      ON public.vendors
      FOR SELECT
      USING (COALESCE(is_active, true) = true)
    $$;
  END IF;
END $$;

-- 2) Create order_cancel_requests table
CREATE TABLE IF NOT EXISTS public.order_cancel_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  buyer_user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'myr',
  reason text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_ocr_order_id ON public.order_cancel_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_ocr_vendor_id ON public.order_cancel_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ocr_buyer_user_id ON public.order_cancel_requests(buyer_user_id);

-- 3) Create order_return_requests table
CREATE TABLE IF NOT EXISTS public.order_return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  buyer_user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'myr',
  reason text,
  preferred_resolution text, -- refund | replacement | store_credit
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orr_order_id ON public.order_return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_orr_vendor_id ON public.order_return_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orr_buyer_user_id ON public.order_return_requests(buyer_user_id);

-- 4) Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ocr_updated_at ON public.order_cancel_requests;
CREATE TRIGGER trg_ocr_updated_at
BEFORE UPDATE ON public.order_cancel_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orr_updated_at ON public.order_return_requests;
CREATE TRIGGER trg_orr_updated_at
BEFORE UPDATE ON public.order_return_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Enable RLS
ALTER TABLE public.order_cancel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_return_requests ENABLE ROW LEVEL SECURITY;

-- Helper: function to check vendor ownership already exists: is_vendor_owner(vendor_id, user_id)

-- 6) RLS policies for order_cancel_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_cancel_requests' AND policyname='Buyers can insert own cancel requests'
  ) THEN
    CREATE POLICY "Buyers can insert own cancel requests"
    ON public.order_cancel_requests
    FOR INSERT
    WITH CHECK (buyer_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_cancel_requests' AND policyname='Buyers can view own cancel requests'
  ) THEN
    CREATE POLICY "Buyers can view own cancel requests"
    ON public.order_cancel_requests
    FOR SELECT
    USING (buyer_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_cancel_requests' AND policyname='Vendors/admins view vendor cancel requests'
  ) THEN
    CREATE POLICY "Vendors/admins view vendor cancel requests"
    ON public.order_cancel_requests
    FOR SELECT
    USING (
      is_vendor_owner(vendor_id, auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_cancel_requests' AND policyname='Vendors/admins update vendor cancel requests'
  ) THEN
    CREATE POLICY "Vendors/admins update vendor cancel requests"
    ON public.order_cancel_requests
    FOR UPDATE
    USING (
      is_vendor_owner(vendor_id, auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    )
    WITH CHECK (
      is_vendor_owner(vendor_id, auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;
END $$;

-- 7) RLS policies for order_return_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_return_requests' AND policyname='Buyers can insert own return requests'
  ) THEN
    CREATE POLICY "Buyers can insert own return requests"
    ON public.order_return_requests
    FOR INSERT
    WITH CHECK (buyer_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_return_requests' AND policyname='Buyers can view own return requests'
  ) THEN
    CREATE POLICY "Buyers can view own return requests"
    ON public.order_return_requests
    FOR SELECT
    USING (buyer_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_return_requests' AND policyname='Vendors/admins view vendor return requests'
  ) THEN
    CREATE POLICY "Vendors/admins view vendor return requests"
    ON public.order_return_requests
    FOR SELECT
    USING (
      is_vendor_owner(vendor_id, auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_return_requests' AND policyname='Vendors/admins update vendor return requests'
  ) THEN
    CREATE POLICY "Vendors/admins update vendor return requests"
    ON public.order_return_requests
    FOR UPDATE
    USING (
      is_vendor_owner(vendor_id, auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    )
    WITH CHECK (
      is_vendor_owner(vendor_id, auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;
END $$;