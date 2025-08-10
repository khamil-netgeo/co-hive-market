-- Harden function: set explicit search_path per linter guidance
CREATE OR REPLACE FUNCTION public.enforce_product_shipping_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
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