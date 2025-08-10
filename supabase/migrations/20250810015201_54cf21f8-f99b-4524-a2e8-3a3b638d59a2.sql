-- Ensure enforce_product_shipping_rules trigger is attached to products
-- Keep the existing function body (already present) and (re)create the trigger

-- Recreate function to be safe (no SECURITY DEFINER) and idempotent
CREATE OR REPLACE FUNCTION public.enforce_product_shipping_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.product_kind = 'prepared_food' THEN
    NEW.allow_easyparcel := false;
    NEW.allow_rider_delivery := true;
  END IF;

  IF NEW.product_kind = 'grocery' AND COALESCE(NEW.perishable, false) = true THEN
    NEW.allow_easyparcel := false;
  END IF;

  IF COALESCE(NEW.allow_easyparcel, false) = false AND COALESCE(NEW.allow_rider_delivery, false) = false THEN
    NEW.allow_rider_delivery := true;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger on products
DROP TRIGGER IF EXISTS trg_enforce_product_shipping ON public.products;
CREATE TRIGGER trg_enforce_product_shipping
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.enforce_product_shipping_rules();
