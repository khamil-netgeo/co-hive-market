-- Create vouchers and voucher_redemptions tables with RLS, triggers, and indexes
-- Uses existing helper functions: public.update_updated_at_column(), public.validate_voucher_redemption()

-- 1) Vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- expected values: 'active', 'inactive'
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  usage_limit INTEGER,           -- total max redemptions overall
  per_user_limit INTEGER,        -- max redemptions per user
  discount_percent INTEGER,      -- 1-100, either this or amount cents can be used by app logic
  discount_amount_cents INTEGER, -- fixed amount in cents
  min_order_cents INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vouchers_discount_percent_range CHECK (
    discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 100)
  )
);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Policies for vouchers
DO $$ BEGIN
  -- Admins manage vouchers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vouchers' AND policyname = 'Admins manage vouchers'
  ) THEN
    CREATE POLICY "Admins manage vouchers"
    ON public.vouchers
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
  END IF;

  -- Public can view active vouchers (time valid)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vouchers' AND policyname = 'Public can read active vouchers'
  ) THEN
    CREATE POLICY "Public can read active vouchers"
    ON public.vouchers
    FOR SELECT
    USING (
      status = 'active'
      AND (start_at IS NULL OR start_at <= now())
      AND (end_at IS NULL OR end_at > now())
    );
  END IF;
END $$;

-- Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_vouchers_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_vouchers_updated_at
    BEFORE UPDATE ON public.vouchers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Voucher redemptions table
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- optional linkage to an order (not used by validation function but useful downstream)
  order_id UUID
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON public.voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user_id ON public.voucher_redemptions(user_id);

-- Enable RLS
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for voucher_redemptions
DO $$ BEGIN
  -- Users can insert their own redemptions (validated via trigger)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voucher_redemptions' AND policyname = 'Users insert own redemptions'
  ) THEN
    CREATE POLICY "Users insert own redemptions"
    ON public.voucher_redemptions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;

  -- Users can view their own redemptions; admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voucher_redemptions' AND policyname = 'Users view own redemptions'
  ) THEN
    CREATE POLICY "Users view own redemptions"
    ON public.voucher_redemptions
    FOR SELECT
    USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
  END IF;

  -- Admins can manage all redemptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voucher_redemptions' AND policyname = 'Admins manage redemptions'
  ) THEN
    CREATE POLICY "Admins manage redemptions"
    ON public.voucher_redemptions
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
  END IF;
END $$;

-- Trigger to validate voucher usage before insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_voucher_redemption'
  ) THEN
    CREATE TRIGGER trg_validate_voucher_redemption
    BEFORE INSERT ON public.voucher_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_voucher_redemption();
  END IF;
END $$;