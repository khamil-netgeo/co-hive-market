-- Step 1: Create private payout-proofs bucket and storage policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payout-proofs', 'payout-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']);

-- Storage policies for payout-proofs bucket
CREATE POLICY "Users can upload their own payout proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payout-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payout proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payout-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payout proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payout-proofs' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- Add proof_path column to payouts tables
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS proof_path TEXT;

-- Check if rider_payouts table exists, if not create it
CREATE TABLE IF NOT EXISTS public.rider_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  approved_by UUID,
  paid_by UUID,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'myr',
  status TEXT NOT NULL DEFAULT 'requested',
  method TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  proof_path TEXT,
  reference TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rider_payouts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'rider_payouts'
    ) THEN
        ALTER TABLE public.rider_payouts ENABLE ROW LEVEL SECURITY;
        
        -- Policies for rider_payouts
        CREATE POLICY "Riders view own payouts"
        ON public.rider_payouts
        FOR SELECT
        USING (rider_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

        CREATE POLICY "Riders create payout requests"
        ON public.rider_payouts
        FOR INSERT
        WITH CHECK (rider_user_id = auth.uid() AND requested_by = auth.uid());

        CREATE POLICY "Riders cancel own requested payouts"
        ON public.rider_payouts
        FOR DELETE
        USING (status = 'requested' AND rider_user_id = auth.uid());

        CREATE POLICY "Admins manage rider payouts"
        ON public.rider_payouts
        FOR ALL
        USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
        WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
    END IF;
END $$;

-- Add updated_at trigger for rider_payouts
DROP TRIGGER IF EXISTS trg_rider_payouts_updated_at ON public.rider_payouts;
CREATE TRIGGER trg_rider_payouts_updated_at
BEFORE UPDATE ON public.rider_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add configurable payout settings to app_settings
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'payout_settings',
  '{"default_min_cents": 1000, "min_by_role": {"vendor": 1000, "rider": 1000}}'::jsonb,
  'Configurable minimum payout amounts by role'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;