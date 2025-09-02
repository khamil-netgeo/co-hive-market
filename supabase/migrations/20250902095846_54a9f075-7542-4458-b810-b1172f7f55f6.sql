-- Security Fix Phase 1: Critical Data Protection
-- Fix subscribers table RLS policies to prevent data exposure

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "insert_subscription_service" ON public.subscribers;
DROP POLICY IF EXISTS "update_subscription_service" ON public.subscribers;

-- Create secure policies for subscribers table
CREATE POLICY "Users can view own subscription" 
ON public.subscribers 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Service functions can still manage subscriptions (for webhooks, etc.)
CREATE POLICY "Service functions can manage subscriptions" 
ON public.subscribers 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add RLS policies to rating summary tables (currently unprotected)
ALTER TABLE public.product_rating_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_rating_summary ENABLE ROW LEVEL SECURITY;

-- Allow public read access for rating display (this is expected for product/service listings)
CREATE POLICY "Public can view product ratings" 
ON public.product_rating_summary 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view service ratings" 
ON public.service_rating_summary 
FOR SELECT 
USING (true);

-- Only system/admins can modify rating summaries (these should be computed automatically)
CREATE POLICY "Only system can modify product ratings" 
ON public.product_rating_summary 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Only system can modify service ratings" 
ON public.service_rating_summary 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));