-- Add pickup coordinates to products for geo sorting
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pickup_lat double precision,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision;

-- Optional composite index for location-based filtering (not used by PostgREST directly but helpful later)
CREATE INDEX IF NOT EXISTS idx_products_pickup_coords ON public.products (pickup_lat, pickup_lng);