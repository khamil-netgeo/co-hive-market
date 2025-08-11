-- Address linter warnings: set search_path on newly created functions
CREATE OR REPLACE FUNCTION public.trg_fill_service_booking_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_vendor_id UUID;
  v_duration INTEGER;
BEGIN
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
END; $$;

CREATE OR REPLACE FUNCTION public.trg_prevent_booking_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  IF NEW.scheduled_at IS NULL OR NEW.end_at IS NULL THEN
    RETURN NEW;
  END IF;

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
END; $$;

CREATE OR REPLACE FUNCTION public.trg_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;