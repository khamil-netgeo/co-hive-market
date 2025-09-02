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