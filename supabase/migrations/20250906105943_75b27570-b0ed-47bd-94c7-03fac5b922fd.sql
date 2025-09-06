-- Create order modifications table
CREATE TABLE public.order_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL CHECK (modification_type IN ('quantity_change', 'item_addition', 'item_removal', 'address_change', 'delivery_time_change')),
  original_data JSONB NOT NULL DEFAULT '{}',
  new_data JSONB NOT NULL DEFAULT '{}',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE
);

-- Create order cancellations table
CREATE TABLE public.order_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  refund_type TEXT NOT NULL DEFAULT 'full' CHECK (refund_type IN ('full', 'partial', 'none')),
  refund_amount_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create scheduled orders table
CREATE TABLE public.scheduled_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  recurring_type TEXT CHECK (recurring_type IN ('daily', 'weekly', 'monthly')),
  recurring_interval INTEGER DEFAULT 1,
  end_date TIMESTAMP WITH TIME ZONE,
  cart_snapshot JSONB NOT NULL DEFAULT '{}',
  delivery_preferences JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paused', 'canceled', 'completed')),
  next_execution_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_modifications
CREATE POLICY "Users can view modifications for their orders" ON public.order_modifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_modifications.order_id 
    AND o.buyer_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create modifications for their orders" ON public.order_modifications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_modifications.order_id 
    AND o.buyer_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view modifications for their orders" ON public.order_modifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_modifications.order_id
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update modifications for their orders" ON public.order_modifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_modifications.order_id
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all order modifications" ON public.order_modifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS policies for order_cancellations
CREATE POLICY "Users can view cancellations for their orders" ON public.order_cancellations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_cancellations.order_id 
    AND o.buyer_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create cancellations for their orders" ON public.order_cancellations FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_cancellations.order_id 
    AND o.buyer_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view cancellations for their orders" ON public.order_cancellations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_cancellations.order_id
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update cancellations for their orders" ON public.order_cancellations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_cancellations.order_id
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all order cancellations" ON public.order_cancellations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS policies for scheduled_orders
CREATE POLICY "Users can manage their own scheduled orders" ON public.scheduled_orders FOR ALL
USING (buyer_user_id = auth.uid())
WITH CHECK (buyer_user_id = auth.uid());

CREATE POLICY "Admins can manage all scheduled orders" ON public.scheduled_orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_order_modifications_order_id ON public.order_modifications(order_id);
CREATE INDEX idx_order_modifications_status ON public.order_modifications(status);
CREATE INDEX idx_order_cancellations_order_id ON public.order_cancellations(order_id);
CREATE INDEX idx_order_cancellations_status ON public.order_cancellations(status);
CREATE INDEX idx_scheduled_orders_buyer_user_id ON public.scheduled_orders(buyer_user_id);
CREATE INDEX idx_scheduled_orders_status ON public.scheduled_orders(status);
CREATE INDEX idx_scheduled_orders_next_execution ON public.scheduled_orders(next_execution_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_orders_updated_at
  BEFORE UPDATE ON public.scheduled_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_orders_updated_at();