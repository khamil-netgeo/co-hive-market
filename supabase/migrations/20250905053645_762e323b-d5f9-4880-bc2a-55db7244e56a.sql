-- Create function to handle order status changes and create transitions
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create transition record if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_transitions (
      order_id,
      from_status,
      to_status,
      transitioned_by,
      automated,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      COALESCE(NEW.automated_transition, false),
      COALESCE(NEW.transition_metadata, '{}')
    );
    
    -- Clear the automated transition flags
    NEW.automated_transition := false;
    NEW.transition_metadata := '{}';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add columns to orders table for automation support
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS automated_transition BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transition_metadata JSONB DEFAULT '{}';

-- Create trigger for order status changes
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_order_status_change();

-- Create function to create order from cart
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_delivery_address JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_total_amount INTEGER := 0;
  v_vendor_id UUID;
  v_first_vendor_id UUID;
  v_mixed_vendors BOOLEAN := false;
BEGIN
  -- Check if cart is empty
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  
  -- Check for mixed vendors (not supported yet)
  SELECT DISTINCT p.vendor_id INTO v_first_vendor_id
  FROM public.cart_items ci
  JOIN public.products p ON p.id = ci.product_id
  WHERE ci.user_id = p_user_id
  LIMIT 1;
  
  -- Verify all items are from same vendor
  FOR v_cart_item IN 
    SELECT ci.*, p.vendor_id, p.name as product_name, p.status as product_status
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = p_user_id
  LOOP
    -- Check product is still active
    IF v_cart_item.product_status != 'active' THEN
      RAISE EXCEPTION 'Product % is no longer available', v_cart_item.product_name;
    END IF;
    
    -- Check vendor consistency
    IF v_first_vendor_id != v_cart_item.vendor_id THEN
      RAISE EXCEPTION 'Cart contains items from multiple vendors. Please checkout items from one vendor at a time.';
    END IF;
    
    -- Reserve inventory
    IF NOT public.reserve_inventory(v_cart_item.product_id, v_cart_item.quantity) THEN
      RAISE EXCEPTION 'Insufficient inventory for product %', v_cart_item.product_name;
    END IF;
    
    v_total_amount := v_total_amount + (v_cart_item.unit_price_cents * v_cart_item.quantity);
  END LOOP;
  
  -- Create the order
  INSERT INTO public.orders (
    buyer_user_id,
    vendor_id,
    total_amount_cents,
    currency,
    status,
    delivery_address,
    notes
  ) VALUES (
    p_user_id,
    v_first_vendor_id,
    v_total_amount,
    'myr',
    'pending',
    p_delivery_address,
    p_notes
  ) RETURNING id INTO v_order_id;
  
  -- Create order items from cart
  INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_cents)
  SELECT v_order_id, ci.product_id, ci.quantity, ci.unit_price_cents
  FROM public.cart_items ci
  WHERE ci.user_id = p_user_id;
  
  -- Clear the cart
  DELETE FROM public.cart_items WHERE user_id = p_user_id;
  
  RETURN v_order_id;
END;
$$;

-- Create function for automated status transitions
CREATE OR REPLACE FUNCTION public.auto_transition_order_status(
  p_order_id UUID,
  p_trigger_event TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_new_status TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Get current order status
  SELECT status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id;
  
  IF v_current_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Define status transition rules
  CASE p_trigger_event
    WHEN 'payment_confirmed' THEN
      IF v_current_status IN ('pending', 'to_pay', 'awaiting_payment') THEN
        v_new_status := 'paid';
        v_metadata := jsonb_build_object('trigger', 'payment_confirmed', 'auto_transition', true);
      END IF;
    
    WHEN 'shipment_created' THEN
      IF v_current_status IN ('paid', 'processing', 'ready_to_ship') THEN
        v_new_status := 'shipped';
        v_metadata := jsonb_build_object('trigger', 'shipment_created', 'auto_transition', true);
      END IF;
    
    WHEN 'delivery_confirmed' THEN
      IF v_current_status IN ('shipped', 'in_transit', 'out_for_delivery') THEN
        v_new_status := 'delivered';
        v_metadata := jsonb_build_object('trigger', 'delivery_confirmed', 'auto_transition', true);
      END IF;
    
    WHEN 'vendor_processing' THEN
      IF v_current_status = 'paid' THEN
        v_new_status := 'processing';
        v_metadata := jsonb_build_object('trigger', 'vendor_processing', 'auto_transition', true);
      END IF;
      
    ELSE
      RETURN false;
  END CASE;
  
  -- Apply transition if valid
  IF v_new_status IS NOT NULL AND v_new_status != v_current_status THEN
    UPDATE public.orders
    SET 
      status = v_new_status,
      automated_transition = true,
      transition_metadata = v_metadata,
      updated_at = now()
    WHERE id = p_order_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;