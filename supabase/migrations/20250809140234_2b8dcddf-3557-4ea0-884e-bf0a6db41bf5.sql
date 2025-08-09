-- Fix security linter: add search_path to functions

CREATE OR REPLACE FUNCTION public.find_nearby_riders(
  pickup_lat double precision,
  pickup_lng double precision,
  max_distance_km integer DEFAULT 10
)
RETURNS TABLE(
  rider_id uuid,
  user_id uuid,
  distance_km double precision,
  vehicle_type text,
  rating numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    AND rp.is_verified = true
    AND rp.current_lat IS NOT NULL 
    AND rp.current_lng IS NOT NULL
    AND rp.last_location_update > (now() - INTERVAL '15 minutes')
    AND (6371 * acos(cos(radians(pickup_lat)) * cos(radians(rp.current_lat)) * 
         cos(radians(rp.current_lng) - radians(pickup_lng)) + 
         sin(radians(pickup_lat)) * sin(radians(rp.current_lat)))) <= LEAST(max_distance_km, rp.service_radius_km)
  ORDER BY distance_km ASC
  LIMIT 10;
$function$;

CREATE OR REPLACE FUNCTION public.assign_delivery_to_riders(
  delivery_id_param uuid,
  pickup_lat double precision,
  pickup_lng double precision
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rider_record RECORD;
  assignment_count INTEGER := 0;
BEGIN
  -- Find nearby riders and create assignments
  FOR rider_record IN 
    SELECT rider_id, user_id 
    FROM public.find_nearby_riders(pickup_lat, pickup_lng)
    LIMIT 5
  LOOP
    INSERT INTO public.delivery_assignments (
      delivery_id, 
      rider_user_id,
      expires_at
    ) VALUES (
      delivery_id_param,
      rider_record.user_id,
      now() + INTERVAL '2 minutes'
    );
    
    assignment_count := assignment_count + 1;
  END LOOP;
  
  RETURN assignment_count;
END;
$function$;