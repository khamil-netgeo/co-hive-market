-- Create user payout profiles table for storing payout destinations
CREATE TABLE IF NOT EXISTS public.user_payout_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  method TEXT NOT NULL DEFAULT 'bank_transfer', -- 'bank_transfer' | 'ewallet' | 'other'
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  ewallet_provider TEXT,
  ewallet_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_payout_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users manage their own payout profile
CREATE POLICY "Users can view own payout profile"
ON public.user_payout_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payout profile"
ON public.user_payout_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payout profile"
ON public.user_payout_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all payout profiles
CREATE POLICY "Admins can view payout profiles"
ON public.user_payout_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_user_payout_profiles_updated_at ON public.user_payout_profiles;
CREATE TRIGGER trg_user_payout_profiles_updated_at
BEFORE UPDATE ON public.user_payout_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();