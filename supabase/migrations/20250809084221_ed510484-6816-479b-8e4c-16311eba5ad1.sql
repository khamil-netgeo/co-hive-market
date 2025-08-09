-- Create rider_profiles table
CREATE TABLE public.rider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  vehicle_type TEXT NOT NULL DEFAULT 'bicycle' CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'walking')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  max_delivery_distance_km INTEGER NOT NULL DEFAULT 5,
  hourly_rate_cents INTEGER,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_deliveries INTEGER DEFAULT 0,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_assignments table
CREATE TABLE public.delivery_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL,
  rider_user_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  notified_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Add assignment fields to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN assigned_rider_id UUID,
ADD COLUMN assignment_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN max_assignment_attempts INTEGER DEFAULT 3,
ADD COLUMN current_assignment_attempt INTEGER DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rider_profiles
CREATE POLICY "Riders can view and update own profile" 
ON public.rider_profiles 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all rider profiles" 
ON public.rider_profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Vendors can view nearby riders when creating deliveries" 
ON public.rider_profiles 
FOR SELECT 
USING (status = 'online' AND current_lat IS NOT NULL AND current_lng IS NOT NULL);

-- RLS Policies for delivery_assignments
CREATE POLICY "Riders can view their own assignments" 
ON public.delivery_assignments 
FOR SELECT 
USING (rider_user_id = auth.uid());

CREATE POLICY "Riders can update their own assignments" 
ON public.delivery_assignments 
FOR UPDATE 
USING (rider_user_id = auth.uid() AND status = 'pending') 
WITH CHECK (rider_user_id = auth.uid());

CREATE POLICY "Admins can manage all assignments" 
ON public.delivery_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Vendors can view assignments for their deliveries" 
ON public.delivery_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM deliveries d 
  JOIN orders o ON d.order_id = o.id 
  JOIN vendors v ON o.vendor_id = v.id 
  WHERE d.id = delivery_assignments.delivery_id 
  AND v.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_rider_profiles_user_id ON public.rider_profiles(user_id);
CREATE INDEX idx_rider_profiles_status ON public.rider_profiles(status);
CREATE INDEX idx_rider_profiles_location ON public.rider_profiles(current_lat, current_lng) WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;
CREATE INDEX idx_delivery_assignments_rider ON public.delivery_assignments(rider_user_id);
CREATE INDEX idx_delivery_assignments_delivery ON public.delivery_assignments(delivery_id);
CREATE INDEX idx_delivery_assignments_status ON public.delivery_assignments(status);
CREATE INDEX idx_delivery_assignments_expires ON public.delivery_assignments(expires_at) WHERE status = 'pending';
CREATE INDEX idx_deliveries_assigned_rider ON public.deliveries(assigned_rider_id);

-- Function to find nearby riders
CREATE OR REPLACE FUNCTION public.find_nearby_riders(
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  max_distance_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  rider_user_id UUID,
  distance_km DOUBLE PRECISION,
  vehicle_type TEXT,
  rating DECIMAL(3,2)
) 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rp.user_id,
    (
      6371 * acos(
        cos(radians(pickup_lat)) * 
        cos(radians(rp.current_lat)) * 
        cos(radians(rp.current_lng) - radians(pickup_lng)) + 
        sin(radians(pickup_lat)) * 
        sin(radians(rp.current_lat))
      )
    ) AS distance_km,
    rp.vehicle_type,
    rp.rating
  FROM rider_profiles rp
  WHERE rp.status = 'online'
    AND rp.current_lat IS NOT NULL 
    AND rp.current_lng IS NOT NULL
    AND rp.max_delivery_distance_km >= (
      6371 * acos(
        cos(radians(pickup_lat)) * 
        cos(radians(rp.current_lat)) * 
        cos(radians(rp.current_lng) - radians(pickup_lng)) + 
        sin(radians(pickup_lat)) * 
        sin(radians(rp.current_lat))
      )
    )
  ORDER BY distance_km ASC, rp.rating DESC
  LIMIT 10;
$$;

-- Function to assign delivery to multiple riders
CREATE OR REPLACE FUNCTION public.assign_delivery_to_riders(
  delivery_uuid UUID,
  rider_ids UUID[]
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rider_id UUID;
BEGIN
  -- Update delivery status and assignment attempt
  UPDATE deliveries 
  SET 
    current_assignment_attempt = current_assignment_attempt + 1,
    assignment_expires_at = now() + INTERVAL '5 minutes'
  WHERE id = delivery_uuid;

  -- Create assignment records for each rider
  FOREACH rider_id IN ARRAY rider_ids
  LOOP
    INSERT INTO delivery_assignments (delivery_id, rider_user_id, expires_at)
    VALUES (delivery_uuid, rider_id, now() + INTERVAL '5 minutes')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Trigger to update updated_at column
CREATE TRIGGER update_rider_profiles_updated_at
BEFORE UPDATE ON public.rider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to expire pending assignments
CREATE OR REPLACE FUNCTION public.expire_pending_assignments()
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE delivery_assignments 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$;