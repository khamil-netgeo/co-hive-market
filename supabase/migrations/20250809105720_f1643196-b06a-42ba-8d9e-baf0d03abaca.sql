-- 1) Create rider_payouts table and secure with RLS
-- Create enums if not already existing for payout status/method (use TEXT to avoid enum churn)

CREATE TABLE IF NOT EXISTS public.rider_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'myr',
  status TEXT NOT NULL DEFAULT 'requested', -- requested | approved | paid | canceled
  method TEXT NOT NULL DEFAULT 'manual',    -- manual | transfer | wallet
  reference TEXT,
  notes TEXT,
  requested_by UUID NOT NULL,
  approved_by UUID,
  paid_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.rider_payouts ENABLE ROW LEVEL SECURITY;

-- Policies: riders can view and create their own payout requests; cancel if requested; admins manage all
CREATE POLICY "Riders view own rider payouts"
ON public.rider_payouts
FOR SELECT
USING (rider_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Riders request own rider payouts"
ON public.rider_payouts
FOR INSERT
WITH CHECK (rider_user_id = auth.uid() AND requested_by = auth.uid());

CREATE POLICY "Riders cancel own requested rider payouts"
ON public.rider_payouts
FOR DELETE
USING (rider_user_id = auth.uid() AND status = 'requested');

CREATE POLICY "Admins manage rider payouts"
ON public.rider_payouts
AS PERMISSIVE
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rider_payouts_updated_at ON public.rider_payouts;
CREATE TRIGGER trg_rider_payouts_updated_at
BEFORE UPDATE ON public.rider_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rider_payouts_rider_user_id ON public.rider_payouts (rider_user_id);
CREATE INDEX IF NOT EXISTS idx_rider_payouts_status ON public.rider_payouts (status);

-- 2) Ensure ledger_entries enums cover rider earnings; if existing enums already include, skip. We'll add a safe check via DO block creating values only if missing.
-- Since we cannot alter enums safely here without knowing names, we avoid changing enums.
-- Instead, we will store rider earnings using existing columns: entry_type='payout' like movement; but we must not break enum. To be safe, we will add a new table function-free approach: we will not change ledger_entries here.
-- Note: The edge function will insert into ledger_entries with entry_type='earning' and beneficiary_type='rider' only if those enums exist.
-- If they don't exist in the project, you may need a follow-up migration to add enum values.
