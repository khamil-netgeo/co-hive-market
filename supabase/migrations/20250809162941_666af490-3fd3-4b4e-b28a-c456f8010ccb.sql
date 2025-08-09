
-- 1) Enums for review target and moderation status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_target') THEN
    CREATE TYPE public.review_target AS ENUM ('product', 'service');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
    CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

-- 2) Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type public.review_target NOT NULL,
  target_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  status public.review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_reviews_target_type_id ON public.reviews (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target_status ON public.reviews (target_type, target_id, status);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4) Policies

-- Public can read approved reviews
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved');

-- Users can view their own reviews
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
CREATE POLICY "Users can view own reviews"
  ON public.reviews
  FOR SELECT
  USING (user_id = auth.uid());

-- Vendors can view reviews for their own items (products + services)
DROP POLICY IF EXISTS "Vendors can view reviews for own items" ON public.reviews;
CREATE POLICY "Vendors can view reviews for own items"
  ON public.reviews
  FOR SELECT
  USING (
    (
      target_type = 'product'
      AND EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.vendors v ON v.id = p.vendor_id
        WHERE p.id = reviews.target_id
          AND v.user_id = auth.uid()
      )
    )
    OR
    (
      target_type = 'service'
      AND EXISTS (
        SELECT 1
        FROM public.vendor_services s
        JOIN public.vendors v ON v.id = s.vendor_id
        WHERE s.id = reviews.target_id
          AND v.user_id = auth.uid()
      )
    )
  );

-- Admins can manage all reviews
DROP POLICY IF EXISTS "Admins manage reviews" ON public.reviews;
CREATE POLICY "Admins manage reviews"
  ON public.reviews
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- Users can create their own reviews only if they purchased/booked
DROP POLICY IF EXISTS "Users create own review if eligible" ON public.reviews;
CREATE POLICY "Users create own review if eligible"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (
        target_type = 'product'
        AND EXISTS (
          SELECT 1
          FROM public.order_items oi
          JOIN public.orders o ON o.id = oi.order_id
          WHERE o.buyer_user_id = auth.uid()
            AND oi.product_id = reviews.target_id
            AND o.status IN ('paid', 'fulfilled')
        )
      )
      OR
      (
        target_type = 'service'
        AND EXISTS (
          SELECT 1
          FROM public.service_bookings sb
          WHERE sb.buyer_user_id = auth.uid()
            AND sb.service_id = reviews.target_id
            AND sb.status IN ('paid', 'completed')
        )
      )
    )
  );

-- Users can update their own unapproved reviews (e.g., fix text while pending/rejected)
DROP POLICY IF EXISTS "Users update own unapproved reviews" ON public.reviews;
CREATE POLICY "Users update own unapproved reviews"
  ON public.reviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status IN ('pending', 'rejected'));

-- Users can delete their own unapproved reviews
DROP POLICY IF EXISTS "Users delete own unapproved reviews" ON public.reviews;
CREATE POLICY "Users delete own unapproved reviews"
  ON public.reviews
  FOR DELETE
  USING (user_id = auth.uid() AND status IN ('pending', 'rejected'));

-- 5) Rating summary views (approved reviews only)
CREATE OR REPLACE VIEW public.product_rating_summary AS
SELECT
  target_id AS product_id,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*) AS review_count
FROM public.reviews
WHERE target_type = 'product' AND status = 'approved'
GROUP BY target_id;

CREATE OR REPLACE VIEW public.service_rating_summary AS
SELECT
  target_id AS service_id,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*) AS review_count
FROM public.reviews
WHERE target_type = 'service' AND status = 'approved'
GROUP BY target_id;
