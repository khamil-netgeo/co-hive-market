-- Create cart_items table for persistent cart storage
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for cart items
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart items" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" 
ON public.cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create inventory tracking table
CREATE TABLE public.product_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for inventory
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

-- Inventory policies - fixed to use status instead of is_active
CREATE POLICY "Public can view inventory for active products" 
ON public.product_inventory 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.products p 
  WHERE p.id = product_inventory.product_id 
  AND p.status = 'active'
));

CREATE POLICY "Vendors can manage inventory for their products" 
ON public.product_inventory 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.products p 
  JOIN public.vendors v ON v.id = p.vendor_id 
  WHERE p.id = product_inventory.product_id 
  AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.products p 
  JOIN public.vendors v ON v.id = p.vendor_id 
  WHERE p.id = product_inventory.product_id 
  AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
));

-- Create trigger for inventory updates
CREATE TRIGGER update_product_inventory_updated_at
BEFORE UPDATE ON public.product_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create order status transitions table for workflow automation
CREATE TABLE public.order_status_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transitioned_by UUID REFERENCES auth.users,
  automated BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for status transitions
ALTER TABLE public.order_status_transitions ENABLE ROW LEVEL SECURITY;

-- Status transition policies
CREATE POLICY "Users can view transitions for their orders" 
ON public.order_status_transitions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  LEFT JOIN public.vendors v ON v.id = o.vendor_id 
  WHERE o.id = order_status_transitions.order_id 
  AND (o.buyer_user_id = auth.uid() OR v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "System can insert status transitions" 
ON public.order_status_transitions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Vendors and admins can insert transitions" 
ON public.order_status_transitions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o 
  LEFT JOIN public.vendors v ON v.id = o.vendor_id 
  WHERE o.id = order_status_transitions.order_id 
  AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
));

-- Create function for inventory management
CREATE OR REPLACE FUNCTION public.reserve_inventory(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Get current available inventory
  SELECT (stock_quantity - reserved_quantity) INTO current_available
  FROM public.product_inventory
  WHERE product_id = p_product_id AND track_inventory = true;
  
  -- If no inventory tracking, allow reservation
  IF current_available IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if enough inventory available
  IF current_available >= p_quantity THEN
    -- Reserve the inventory
    UPDATE public.product_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = now()
    WHERE product_id = p_product_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Create function to release reserved inventory
CREATE OR REPLACE FUNCTION public.release_inventory(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_inventory
  SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity),
      updated_at = now()
  WHERE product_id = p_product_id;
  
  RETURN true;
END;
$$;