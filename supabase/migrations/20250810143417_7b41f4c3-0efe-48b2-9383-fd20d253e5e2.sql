-- Vouchers & Redemptions (Phase 1 foundation)
-- Create enum for voucher discount type
DO $$ BEGIN
  CREATE TYPE public.voucher_discount_type AS ENUM ('percent','amount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  discount_type public.voucher_discount_type NOT NULL DEFAULT 'percent',
  discount_value INTEGER NOT NULL, -- percent (0-100) or amount in cents
  min_order_amount_cents INTEGER NOT NULL DEFAULT 0,
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  vendor_id UUID NULL,
  community_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_at TIMESTAMPTZ NULL,
  end_at TIMESTAMPTZ NULL,
  usage_limit INTEGER NULL,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view active vouchers within window
CREATE POLICY IF NOT EXISTS "Public can view active vouchers"
ON public.vouchers FOR SELECT
USING (
  status = 'active'
  AND (start_at IS NULL OR start_at <= now())
  AND (end_at IS NULL OR end_at > now())
);

-- Admins manage vouchers
CREATE POLICY IF NOT EXISTS "Admins manage vouchers"
ON public.vouchers FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- Redemptions table
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS for redemptions
CREATE POLICY IF NOT EXISTS "Users insert own redemptions" ON public.voucher_redemptions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users view own redemptions" ON public.voucher_redemptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins manage redemptions" ON public.voucher_redemptions
FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- Updated_at trigger for vouchers
CREATE OR REPLACE FUNCTION public.trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vouchers_updated_at ON public.vouchers;
CREATE TRIGGER set_vouchers_updated_at
BEFORE UPDATE ON public.vouchers
FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();

-- Validation function for redemption limits and window
CREATE OR REPLACE FUNCTION public.validate_voucher_redemption()
RETURNS TRIGGER AS $$
DECLARE
  v_record public.vouchers;
  total_used INTEGER;
  user_used INTEGER;
BEGIN
  SELECT * INTO v_record FROM public.vouchers WHERE id = NEW.voucher_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found';
  END IF;
  IF v_record.status <> 'active' THEN
    RAISE EXCEPTION 'Voucher inactive';
  END IF;
  IF v_record.start_at IS NOT NULL AND v_record.start_at > now() THEN
    RAISE EXCEPTION 'Voucher not started';
  END IF;
  IF v_record.end_at IS NOT NULL AND v_record.end_at <= now() THEN
    RAISE EXCEPTION 'Voucher expired';
  END IF;
  IF v_record.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO total_used FROM public.voucher_redemptions WHERE voucher_id = NEW.voucher_id;
    IF total_used >= v_record.usage_limit THEN
      RAISE EXCEPTION 'Voucher usage limit reached';
    END IF;
  END IF;
  IF v_record.per_user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO user_used FROM public.voucher_redemptions WHERE voucher_id = NEW.voucher_id AND user_id = NEW.user_id;
    IF user_used >= v_record.per_user_limit THEN
      RAISE EXCEPTION 'Per-user limit reached';
    END IF;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DROP TRIGGER IF EXISTS validate_voucher_redemption ON public.voucher_redemptions;
CREATE TRIGGER validate_voucher_redemption
BEFORE INSERT ON public.voucher_redemptions
FOR EACH ROW EXECUTE FUNCTION public.validate_voucher_redemption();