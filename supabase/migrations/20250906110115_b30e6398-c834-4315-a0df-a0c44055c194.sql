-- Create helper functions for advanced order management
-- These functions will handle the new table operations until types are regenerated

CREATE OR REPLACE FUNCTION public.insert_order_modification(
  p_order_id UUID,
  p_modification_type TEXT,
  p_original_data JSONB,
  p_new_data JSONB,
  p_reason TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.order_modifications (
    order_id,
    modification_type,
    original_data,
    new_data,
    reason,
    status
  ) VALUES (
    p_order_id,
    p_modification_type,
    p_original_data,
    p_new_data,
    p_reason,
    'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_modifications(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  modification_type TEXT,
  original_data JSONB,
  new_data JSONB,
  reason TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.id,
    om.order_id,
    om.modification_type,
    om.original_data,
    om.new_data,
    om.reason,
    om.status,
    om.created_at,
    om.approved_at,
    om.applied_at
  FROM public.order_modifications om
  WHERE om.order_id = p_order_id
  ORDER BY om.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_order_cancellation(
  p_order_id UUID,
  p_reason TEXT,
  p_refund_type TEXT,
  p_refund_amount_cents INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.order_cancellations (
    order_id,
    reason,
    refund_type,
    refund_amount_cents,
    status
  ) VALUES (
    p_order_id,
    p_reason,
    p_refund_type,
    p_refund_amount_cents,
    'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_cancellations(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  reason TEXT,
  refund_type TEXT,
  refund_amount_cents INTEGER,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oc.id,
    oc.order_id,
    oc.reason,
    oc.refund_type,
    oc.refund_amount_cents,
    oc.status,
    oc.created_at,
    oc.processed_at
  FROM public.order_cancellations oc
  WHERE oc.order_id = p_order_id
  ORDER BY oc.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_scheduled_order(
  p_buyer_user_id UUID,
  p_scheduled_for TIMESTAMP WITH TIME ZONE,
  p_cart_snapshot JSONB,
  p_delivery_preferences JSONB,
  p_recurring_type TEXT DEFAULT NULL,
  p_recurring_interval INTEGER DEFAULT 1,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scheduled_order_id UUID;
BEGIN
  INSERT INTO public.scheduled_orders (
    buyer_user_id,
    scheduled_for,
    cart_snapshot,
    delivery_preferences,
    recurring_type,
    recurring_interval,
    end_date,
    status,
    next_execution_at
  ) VALUES (
    p_buyer_user_id,
    p_scheduled_for,
    p_cart_snapshot,
    p_delivery_preferences,
    p_recurring_type,
    p_recurring_interval,
    p_end_date,
    'scheduled',
    p_scheduled_for
  ) RETURNING id INTO v_scheduled_order_id;
  
  RETURN v_scheduled_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scheduled_orders(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  buyer_user_id UUID,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  recurring_type TEXT,
  recurring_interval INTEGER,
  end_date TIMESTAMP WITH TIME ZONE,
  cart_snapshot JSONB,
  delivery_preferences JSONB,
  status TEXT,
  next_execution_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.id,
    so.buyer_user_id,
    so.scheduled_for,
    so.recurring_type,
    so.recurring_interval,
    so.end_date,
    so.cart_snapshot,
    so.delivery_preferences,
    so.status,
    so.next_execution_at,
    so.created_at,
    so.updated_at
  FROM public.scheduled_orders so
  WHERE so.buyer_user_id = p_user_id
  ORDER BY so.next_execution_at ASC;
END;
$$;