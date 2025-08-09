-- Structured fields for vendor_services and service add-ons
-- 1) Extend vendor_services with professional service metadata (safe defaults)
ALTER TABLE public.vendor_services
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS pricing_model TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_model IN ('fixed','hourly','per_unit')),
  ADD COLUMN IF NOT EXISTS location_type TEXT NOT NULL DEFAULT 'vendor' CHECK (location_type IN ('vendor','customer','remote')),
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER,
  ADD COLUMN IF NOT EXISTS min_notice_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS booking_window_days INTEGER,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS availability_preset TEXT NOT NULL DEFAULT 'weekdays_9_6' CHECK (availability_preset IN ('weekdays_9_6','weekends','custom')),
  ADD COLUMN IF NOT EXISTS travel_fee_per_km_cents INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_cents INTEGER,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT 'moderate' CHECK (cancellation_policy IN ('flexible','moderate','strict')),
  ADD COLUMN IF NOT EXISTS has_addons BOOLEAN NOT NULL DEFAULT false;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_status ON public.vendor_services (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_services_location ON public.vendor_services (location_type);

-- 2) Add service_addons table
CREATE TABLE IF NOT EXISTS public.service_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.vendor_services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta_cents INTEGER NOT NULL DEFAULT 0,
  time_delta_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to maintain updated_at
CREATE TRIGGER tg_service_addons_updated_at
BEFORE UPDATE ON public.service_addons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_addons_service ON public.service_addons (service_id);

-- Enable RLS on service_addons
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

-- Policies for service_addons
-- Public can read addons for active services
CREATE POLICY IF NOT EXISTS "Public can view addons for active services"
ON public.service_addons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_services s
    WHERE s.id = service_addons.service_id AND s.status = 'active'
  )
);

-- Vendors/admins can view their own addons
CREATE POLICY IF NOT EXISTS "Vendors/admins view own addons"
ON public.service_addons
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_addons.service_id AND (v.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  )
);

-- Vendors/admins insert addons for their own services
CREATE POLICY IF NOT EXISTS "Vendors/admins insert addons"
ON public.service_addons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_addons.service_id AND (v.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  )
);

-- Vendors/admins update addons for their own services
CREATE POLICY IF NOT EXISTS "Vendors/admins update addons"
ON public.service_addons
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_addons.service_id AND (v.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_addons.service_id AND (v.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  )
);

-- Vendors/admins delete addons for their own services
CREATE POLICY IF NOT EXISTS "Vendors/admins delete addons"
ON public.service_addons
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_addons.service_id AND (v.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  )
);
