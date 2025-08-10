-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_method') THEN
    CREATE TYPE public.shipping_method AS ENUM ('rider','easyparcel');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_kind_type') THEN
    CREATE TYPE public.product_kind_type AS ENUM ('prepared_food','packaged_food','grocery','other');
  END IF;
END $$;

-- 2) Products table alterations
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS allow_easyparcel boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_rider_delivery boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_kind public.product_kind_type DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS length_cm integer,
  ADD COLUMN IF NOT EXISTS width_cm integer,
  ADD COLUMN IF NOT EXISTS height_cm integer;

-- Ensure weight_grams exists (it already does per schema) - keep as is

-- 3) Orders table alterations
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_method public.shipping_method,
  ADD COLUMN IF NOT EXISTS shipping_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS ship_address_line1 text,
  ADD COLUMN IF NOT EXISTS ship_address_line2 text,
  ADD COLUMN IF NOT EXISTS ship_city text,
  ADD COLUMN IF NOT EXISTS ship_state text,
  ADD COLUMN IF NOT EXISTS ship_postcode text,
  ADD COLUMN IF NOT EXISTS ship_country text DEFAULT 'MY',
  ADD COLUMN IF NOT EXISTS easyparcel_awb_no text,
  ADD COLUMN IF NOT EXISTS easyparcel_order_no text;

-- 4) Triggers to enforce food/grocery rules
CREATE OR REPLACE FUNCTION public.enforce_product_shipping_rules()
RETURNS trigger AS $$
BEGIN
  -- Prepared food cannot be shipped via EasyParcel
  IF NEW.product_kind = 'prepared_food' THEN
    NEW.allow_easyparcel := false;
    NEW.allow_rider_delivery := true; -- ensure at least rider enabled
  END IF;

  -- Groceries that are perishable cannot be shipped via EasyParcel
  IF NEW.product_kind = 'grocery' AND COALESCE(NEW.perishable, false) = true THEN
    NEW.allow_easyparcel := false;
  END IF;

  -- Ensure at least one method is enabled
  IF COALESCE(NEW.allow_easyparcel, false) = false AND COALESCE(NEW.allow_rider_delivery, false) = false THEN
    NEW.allow_rider_delivery := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DROP TRIGGER IF EXISTS trg_enforce_product_shipping_rules ON public.products;
CREATE TRIGGER trg_enforce_product_shipping_rules
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_shipping_rules();

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_product_kind ON public.products(product_kind);
CREATE INDEX IF NOT EXISTS idx_products_allow_easyparcel ON public.products(allow_easyparcel);
CREATE INDEX IF NOT EXISTS idx_products_allow_rider ON public.products(allow_rider_delivery);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method ON public.orders(shipping_method);
