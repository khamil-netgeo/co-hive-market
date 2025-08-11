-- Create service_time_off table for vendor availability blocking
CREATE TABLE public.service_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_time_off ENABLE ROW LEVEL SECURITY;

-- Create policies for service_time_off
CREATE POLICY "Vendors can view their own time off blocks"
ON public.service_time_off 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id 
    AND v.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Vendors can create their own time off blocks"
ON public.service_time_off 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id 
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update their own time off blocks"
ON public.service_time_off 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id 
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id 
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can delete their own time off blocks"
ON public.service_time_off 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = service_time_off.vendor_id 
    AND v.user_id = auth.uid()
  )
);

-- Admins can manage all time off blocks
CREATE POLICY "Admins can manage all time off blocks"
ON public.service_time_off 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_service_time_off_updated_at
  BEFORE UPDATE ON public.service_time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add validation trigger to ensure end_at is after start_at
CREATE OR REPLACE FUNCTION public.validate_time_off_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_at <= NEW.start_at THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_time_off_period_trigger
  BEFORE INSERT OR UPDATE ON public.service_time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_time_off_period();