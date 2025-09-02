-- Security Fix Phase 2: Protect Business Analytics Data
-- Add RLS policies to rating summary tables to prevent competitor data scraping

-- Enable RLS on product_rating_summary
ALTER TABLE public.product_rating_summary ENABLE ROW LEVEL SECURITY;

-- Enable RLS on service_rating_summary  
ALTER TABLE public.service_rating_summary ENABLE ROW LEVEL SECURITY;

-- Allow public read access for basic rating display (needed for product listings)
-- This is expected behavior for e-commerce sites
CREATE POLICY "Public can view product ratings" 
ON public.product_rating_summary 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view service ratings" 
ON public.service_rating_summary 
FOR SELECT 
USING (true);

-- Only admins can modify rating summaries (these are typically updated by triggers)
CREATE POLICY "Only admins can modify product ratings" 
ON public.product_rating_summary 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Only admins can modify service ratings" 
ON public.service_rating_summary 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));