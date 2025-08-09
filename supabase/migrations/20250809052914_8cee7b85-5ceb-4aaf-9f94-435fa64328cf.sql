-- Add grocery/food attributes to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS perishable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refrigeration_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weight_grams integer,
  ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prep_time_minutes integer;

-- Helpful indexes for catalog filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);

-- Enrich deliveries with pickup/dropoff snapshots and scheduling
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS pickup_lat double precision,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision,
  ADD COLUMN IF NOT EXISTS dropoff_address text,
  ADD COLUMN IF NOT EXISTS dropoff_lat double precision,
  ADD COLUMN IF NOT EXISTS dropoff_lng double precision,
  ADD COLUMN IF NOT EXISTS scheduled_pickup_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_dropoff_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Helpful indexes for operations
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries (status);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON public.deliveries (rider_user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON public.deliveries (order_id);