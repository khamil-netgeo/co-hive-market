-- 1) Trigger to auto-update last_location_update on rider location changes
CREATE OR REPLACE FUNCTION public.update_rider_last_location_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.current_lat IS DISTINCT FROM OLD.current_lat) OR (NEW.current_lng IS DISTINCT FROM OLD.current_lng) THEN
      NEW.last_location_update := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rider_profiles_update_location ON public.rider_profiles;
CREATE TRIGGER trg_rider_profiles_update_location
BEFORE UPDATE ON public.rider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_rider_last_location_timestamp();

-- 2) Relax verification requirement for nearby rider matching
CREATE OR REPLACE FUNCTION public.find_nearby_riders(pickup_lat double precision, pickup_lng double precision, max_distance_km integer DEFAULT 10)
RETURNS TABLE(rider_id uuid, user_id uuid, distance_km double precision, vehicle_type text, rating numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    rp.id as rider_id,
    rp.user_id,
    (6371 * acos(cos(radians(pickup_lat)) * cos(radians(rp.current_lat)) * 
     cos(radians(rp.current_lng) - radians(pickup_lng)) + 
     sin(radians(pickup_lat)) * sin(radians(rp.current_lat)))) as distance_km,
    rp.vehicle_type,
    rp.rating
  FROM public.rider_profiles rp
  WHERE rp.is_available = true 
    -- Removed strict verification requirement to allow pilot matching
    -- AND rp.is_verified = true
    AND rp.current_lat IS NOT NULL 
    AND rp.current_lng IS NOT NULL
    AND rp.last_location_update > (now() - INTERVAL '15 minutes')
    AND (6371 * acos(cos(radians(pickup_lat)) * cos(radians(rp.current_lat)) * 
         cos(radians(rp.current_lng) - radians(pickup_lng)) + 
         sin(radians(pickup_lat)) * sin(radians(rp.current_lat)))) <= LEAST(max_distance_km, rp.service_radius_km)
  ORDER BY distance_km ASC
  LIMIT 10;
$$;