-- Phase 1: Customer Experience Features

-- Enhanced order chat system
CREATE TABLE IF NOT EXISTS public.order_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  receiver_user_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  template_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.order_chats ENABLE ROW LEVEL SECURITY;

-- Policies for order chats
CREATE POLICY "Order participants can view messages"
ON public.order_chats FOR SELECT
USING (
  sender_user_id = auth.uid() OR 
  receiver_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = order_chats.order_id 
    AND (o.buyer_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors v WHERE v.id = o.vendor_id AND v.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Order participants can send messages"
ON public.order_chats FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = order_chats.order_id 
    AND (o.buyer_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors v WHERE v.id = o.vendor_id AND v.user_id = auth.uid()
    ))
  )
);

-- Chat message templates
CREATE TABLE IF NOT EXISTS public.chat_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  template_key TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL, -- 'rider', 'customer', 'vendor'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default templates
INSERT INTO public.chat_message_templates (category, template_key, message, role) VALUES
  ('delivery_update', 'on_way_pickup', 'I am on my way to collect your order. ETA: 10 minutes.', 'rider'),
  ('delivery_update', 'picked_up', 'Order picked up successfully. Now heading to delivery location.', 'rider'),
  ('delivery_update', 'nearby_delivery', 'I am nearby your delivery location. Please be ready to receive.', 'rider'),
  ('delivery_update', 'delivered', 'Order delivered successfully. Thank you!', 'rider'),
  ('delivery_issue', 'cannot_find_address', 'I am having trouble finding your address. Can you provide more details?', 'rider'),
  ('delivery_issue', 'delayed', 'Sorry, I will be slightly delayed due to traffic. New ETA: 15 minutes.', 'rider'),
  ('customer_response', 'ready_pickup', 'I am ready for pickup. Please come to the main entrance.', 'customer'),
  ('customer_response', 'ready_delivery', 'I am ready to receive the delivery.', 'customer'),
  ('customer_response', 'not_ready', 'Please give me 5 more minutes.', 'customer');

-- Make templates publicly readable
ALTER TABLE public.chat_message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read message templates"
ON public.chat_message_templates FOR SELECT
USING (is_active = true);

-- Live rider location tracking table for order tracking
CREATE TABLE IF NOT EXISTS public.rider_location_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_user_id UUID NOT NULL,
  order_id UUID,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  accuracy_meters DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.rider_location_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies for location snapshots
CREATE POLICY "Riders can insert own location"
ON public.rider_location_snapshots FOR INSERT
WITH CHECK (rider_user_id = auth.uid());

CREATE POLICY "Order participants can view rider location"
ON public.rider_location_snapshots FOR SELECT
USING (
  rider_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = rider_location_snapshots.order_id 
    AND (o.buyer_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors v WHERE v.id = o.vendor_id AND v.user_id = auth.uid()
    ))
  )
);

-- ETA calculations table
CREATE TABLE IF NOT EXISTS public.delivery_etas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  delivery_id UUID,
  rider_user_id UUID NOT NULL,
  estimated_pickup_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_at TIMESTAMP WITH TIME ZONE,
  distance_to_pickup_km DOUBLE PRECISION,
  distance_to_delivery_km DOUBLE PRECISION,
  traffic_factor DOUBLE PRECISION DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_etas ENABLE ROW LEVEL SECURITY;

-- Policies for ETAs
CREATE POLICY "Order participants can view ETAs"
ON public.delivery_etas FOR SELECT
USING (
  rider_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = delivery_etas.order_id 
    AND (o.buyer_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors v WHERE v.id = o.vendor_id AND v.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Riders and system can manage ETAs"
ON public.delivery_etas FOR ALL
USING (rider_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (rider_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Add realtime to tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_location_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_etas;

-- Set replica identity for realtime
ALTER TABLE public.order_chats REPLICA IDENTITY FULL;
ALTER TABLE public.rider_location_snapshots REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_etas REPLICA IDENTITY FULL;