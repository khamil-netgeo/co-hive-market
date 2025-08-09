-- Create rider profiles table
CREATE TABLE public.rider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car', 'scooter')),
  license_number TEXT,
  service_radius_km INTEGER NOT NULL DEFAULT 10 CHECK (service_radius_km > 0 AND service_radius_km <= 50),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  is_available BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on rider profiles
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for rider profiles
CREATE POLICY "Riders can view and edit own profile" 
ON public.rider_profiles 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all rider profiles" 
ON public.rider_profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Public can view active riders for matching" 
ON public.rider_profiles 
FOR SELECT 
USING (is_available = true AND is_verified = true);

-- Add rider assignment fields to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN assigned_at TIMESTAMPTZ,
ADD COLUMN assignment_expires_at TIMESTAMPTZ,
ADD COLUMN rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5);

-- Create delivery assignments tracking table
CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  rider_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  notified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on delivery assignments
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery assignments
CREATE POLICY "Riders can view own assignments" 
ON public.delivery_assignments 
FOR SELECT 
USING (rider_user_id = auth.uid());

CREATE POLICY "Riders can update own assignments" 
ON public.delivery_assignments 
FOR UPDATE 
USING (rider_user_id = auth.uid())
WITH CHECK (rider_user_id = auth.uid());

CREATE POLICY "System can create assignments" 
ON public.delivery_assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all assignments" 
ON public.delivery_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_rider_profiles_location ON public.rider_profiles(current_lat, current_lng);
CREATE INDEX idx_rider_profiles_available ON public.rider_profiles(is_available, is_verified);
CREATE INDEX idx_delivery_assignments_rider ON public.delivery_assignments(rider_user_id, status);
CREATE INDEX idx_delivery_assignments_delivery ON public.delivery_assignments(delivery_id, status);
CREATE INDEX idx_delivery_assignments_expires ON public.delivery_assignments(expires_at);

-- Create function to find nearby available riders
CREATE OR REPLACE FUNCTION public.find_nearby_riders(
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  max_distance_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  rider_id UUID,
  user_id UUID,
  distance_km DOUBLE PRECISION,
  vehicle_type TEXT,
  rating DECIMAL(3,2)
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
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
    AND rp.is_verified = true
    AND rp.current_lat IS NOT NULL 
    AND rp.current_lng IS NOT NULL
    AND rp.last_location_update > (now() - INTERVAL '15 minutes')
    AND (6371 * acos(cos(radians(pickup_lat)) * cos(radians(rp.current_lat)) * 
         cos(radians(rp.current_lng) - radians(pickup_lng)) + 
         sin(radians(pickup_lat)) * sin(radians(rp.current_lat)))) <= LEAST(max_distance_km, rp.service_radius_km)
  ORDER BY distance_km ASC
  LIMIT 10;
$$;

-- Create function to assign delivery to riders
CREATE OR REPLACE FUNCTION public.assign_delivery_to_riders(
  delivery_id_param UUID,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create updated_at trigger for rider profiles
CREATE TRIGGER update_rider_profiles_updated_at
  BEFORE UPDATE ON public.rider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for rider functionality
ALTER TABLE public.rider_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;