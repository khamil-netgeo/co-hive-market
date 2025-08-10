-- Create table to snapshot cart items at checkout time
CREATE TABLE IF NOT EXISTS public.cart_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vendor_id UUID,
  currency TEXT,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: users can insert/select their own snapshots
CREATE POLICY IF NOT EXISTS "Users insert own cart snapshots"
ON public.cart_snapshots
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users view own cart snapshots"
ON public.cart_snapshots
FOR SELECT
USING (user_id = auth.uid());

-- Optional: cleanup is handled by service role or separate jobs; no public delete policy for safety
