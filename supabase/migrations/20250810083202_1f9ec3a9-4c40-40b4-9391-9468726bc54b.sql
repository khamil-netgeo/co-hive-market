-- Add a timestamp for buyer confirmation of receipt
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMPTZ NULL;

-- Create a helpful index for querying recently confirmed orders (optional but useful)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_confirmed_at ON public.orders (buyer_confirmed_at);

-- No RLS changes needed; existing UPDATE policy allows buyers to update their own orders.