-- Create table for vendor service listings (one-off services)
CREATE TABLE public.vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'myr',
  duration_minutes INTEGER,
  service_area TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_services_vendor ON public.vendor_services(vendor_id);

ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active services are publicly readable"
ON public.vendor_services
FOR SELECT
USING (status = 'active');

CREATE POLICY "Vendors/admins view own services"
ON public.vendor_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

CREATE POLICY "Vendors/admins insert services"
ON public.vendor_services
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

CREATE POLICY "Vendors/admins update services"
ON public.vendor_services
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

CREATE POLICY "Vendors/admins delete services"
ON public.vendor_services
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

-- Bookings table
CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  buyer_user_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  total_amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'myr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_bookings_service ON public.service_bookings(service_id);
CREATE INDEX idx_service_bookings_buyer ON public.service_bookings(buyer_user_id);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers insert own bookings"
ON public.service_bookings
FOR INSERT
WITH CHECK (buyer_user_id = auth.uid());

CREATE POLICY "View own or vendor bookings"
ON public.service_bookings
FOR SELECT
USING (
  buyer_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_bookings.service_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

CREATE POLICY "Update own or vendor bookings"
ON public.service_bookings
FOR UPDATE
USING (
  buyer_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_bookings.service_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
)
WITH CHECK (
  buyer_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_bookings.service_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);

CREATE POLICY "Delete own or vendor bookings"
ON public.service_bookings
FOR DELETE
USING (
  buyer_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.vendor_services s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE s.id = service_bookings.service_id
      AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
  )
);
