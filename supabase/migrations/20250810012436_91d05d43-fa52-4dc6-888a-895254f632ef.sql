-- Function to check if current user can submit a review
CREATE OR REPLACE FUNCTION public.can_submit_review(
  _target_type public.review_target,
  _target_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _target_type = 'product'::public.review_target THEN EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE o.buyer_user_id = auth.uid()
        AND oi.product_id = _target_id
        AND o.status IN ('paid','fulfilled')
    )
    WHEN _target_type = 'service'::public.review_target THEN EXISTS (
      SELECT 1
      FROM public.service_bookings sb
      WHERE sb.buyer_user_id = auth.uid()
        AND sb.service_id = _target_id
        AND sb.status IN ('paid','completed')
    )
    ELSE FALSE
  END;
$$;