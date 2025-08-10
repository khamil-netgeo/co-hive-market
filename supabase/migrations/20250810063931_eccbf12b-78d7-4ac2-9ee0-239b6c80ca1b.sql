-- Add vendor pickup/shipping fields for EasyParcel
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS pickup_postcode text,
  ADD COLUMN IF NOT EXISTS pickup_state text,
  ADD COLUMN IF NOT EXISTS pickup_country text DEFAULT 'MY',
  ADD COLUMN IF NOT EXISTS pickup_contact_name text,
  ADD COLUMN IF NOT EXISTS pickup_phone text;

-- Create trigger to enforce product shipping rules on insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_product_shipping'
  ) THEN
    CREATE TRIGGER trg_enforce_product_shipping
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.enforce_product_shipping_rules();
  END IF;
END $$;