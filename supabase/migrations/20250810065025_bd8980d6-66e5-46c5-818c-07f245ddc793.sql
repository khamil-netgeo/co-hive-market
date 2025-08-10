-- Add pickup fields to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS pickup_address_line1 text,
  ADD COLUMN IF NOT EXISTS pickup_city text;
