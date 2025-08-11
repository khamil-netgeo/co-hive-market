-- Service scheduling schema and constraints

-- 1) Availability rules per vendor/service
CREATE TABLE IF NOT EXISTS public.service_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  service_id UUID NULL,
  day_of_week SMALLINT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  valid_from DATE NULL,
  valid_to DATE NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  capacity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Time off blocks per vendor/service
CREATE TABLE IF NOT EXISTS public.service_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  service_id UUID NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys (avoid referencing auth schema per best practice; vendors table already exists)
ALTER TABLE public.service_availability_rules
  ADD CONSTRAINT fk_sar_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
ALTER TABLE public.service_availability_rules
  ADD CONSTRAINT fk_sar_service FOREIGN KEY (service_id) REFERENCES public.vendor_services(id) ON DELETE CASCADE;

ALTER TABLE public.service_time_off
  ADD CONSTRAINT fk_sto_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
ALTER TABLE public.service_time_off
  ADD CONSTRAINT fk_sto_service FOREIGN KEY (service_id) REFERENCES public.vendor_services(id) ON DELETE CASCADE;

-- Basic sanity constraint
ALTER TABLE public.service_availability_rules
  ADD CONSTRAINT chk_sar_time_range CHECK (start_time < end_time);
ALTER TABLE public.service_time_off
  ADD CONSTRAINT chk_sto_time_range CHECK (start_at < end_at);

-- 3) Extend service_bookings to support scheduling and vendor ownership
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'service_bookings' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN vendor_id UUID NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'service_bookings' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN duration_minutes INTEGER NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'service_bookings' AND column_name = 'end_at'
  ) THEN
    ALTER TABLE public.service_bookings ADD COLUMN end_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sar_vendor_service_dow ON public.service_availability_rules (vendor_id, service_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_sto_vendor_service_time ON public.service_time_off (vendor_id, service_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_sb_vendor_time ON public.service_bookings (vendor_id, scheduled_at, end_at);

-- 4) Trigger to auto-populate vendor_id, duration and end_at on service_bookings
CREATE OR REPLACE FUNCTION public.trg_fill_service_booking_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id UUID;
  v_duration INTEGER;
BEGIN
  -- Look up vendor_id and default duration from vendor_services
  SELECT vs.vendor_id, COALESCE(vs.duration_minutes, 60) INTO v_vendor_id, v_duration
  FROM public.vendor_services vs
  WHERE vs.id = NEW.service_id;

  IF NEW.vendor_id IS NULL THEN
    NEW.vendor_id := v_vendor_id;
  END IF;
  IF NEW.duration_minutes IS NULL THEN
    NEW.duration_minutes := v_duration;
  END IF;
  IF NEW.scheduled_at IS NOT NULL AND NEW.end_at IS NULL THEN
    NEW.end_at := NEW.scheduled_at + make_interval(mins => COALESCE(NEW.duration_minutes, v_duration));
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_service_booking_fields ON public.service_bookings;
CREATE TRIGGER trg_fill_service_booking_fields
BEFORE INSERT OR UPDATE OF service_id, scheduled_at, duration_minutes ON public.service_bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_fill_service_booking_fields();

-- 5) Prevent overlapping bookings for the same vendor/service when active
CREATE OR REPLACE FUNCTION public.trg_prevent_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Only enforce when both times exist and booking is active/paying
  IF NEW.scheduled_at IS NULL OR NEW.end_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Consider active statuses
  IF COALESCE(NEW.status, 'pending') IN ('paid', 'confirmed', 'scheduled') THEN
    SELECT COUNT(*) INTO conflict_count
    FROM public.service_bookings sb
    WHERE sb.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND sb.vendor_id = NEW.vendor_id
      AND sb.service_id = NEW.service_id
      AND COALESCE(sb.status, 'pending') IN ('paid', 'confirmed', 'scheduled')
      AND sb.scheduled_at < NEW.end_at
      AND sb.end_at > NEW.scheduled_at;

    IF conflict_count > 0 THEN
      RAISE EXCEPTION 'Time slot overlaps an existing booking.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_booking_overlap ON public.service_bookings;
CREATE TRIGGER trg_prevent_booking_overlap
BEFORE INSERT OR UPDATE OF scheduled_at, end_at, status ON public.service_bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_booking_overlap();

-- 6) Basic RLS for new tables
ALTER TABLE public.service_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_time_off ENABLE ROW LEVEL SECURITY;

-- Vendors manage their own availability rules
DROP POLICY IF EXISTS "Vendors manage availability rules" ON public.service_availability_rules;
CREATE POLICY "Vendors manage availability rules"
ON public.service_availability_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_availability_rules.vendor_id AND v.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_availability_rules.vendor_id AND v.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Vendors manage their own time off blocks
DROP POLICY IF EXISTS "Vendors manage time off" ON public.service_time_off;
CREATE POLICY "Vendors manage time off"
ON public.service_time_off
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id AND v.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id AND v.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Helpful update triggers for updated_at
CREATE OR REPLACE FUNCTION public.trg_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_sar ON public.service_availability_rules;
CREATE TRIGGER trg_touch_sar
BEFORE UPDATE ON public.service_availability_rules
FOR EACH ROW EXECUTE FUNCTION public.trg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_sto ON public.service_time_off;
CREATE TRIGGER trg_touch_sto
BEFORE UPDATE ON public.service_time_off
FOR EACH ROW EXECUTE FUNCTION public.trg_touch_updated_at();
