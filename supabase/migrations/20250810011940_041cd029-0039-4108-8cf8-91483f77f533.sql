-- Review images support + storage policies

-- 1) Table for review images
CREATE TABLE IF NOT EXISTS public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON public.review_images(review_id);

-- RLS Policies
-- Public can view images for approved reviews
CREATE POLICY "Public view images of approved reviews"
ON public.review_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_images.review_id
      AND r.status = 'approved'
  )
);

-- Owners can also view their own images (even if not approved yet)
CREATE POLICY "Owners view own review images"
ON public.review_images
FOR SELECT
USING (user_id = auth.uid());

-- Owners can insert images tied to their own pending/rejected reviews
CREATE POLICY "Owners add images to own unapproved review"
ON public.review_images
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_images.review_id
      AND r.user_id = auth.uid()
      AND r.status IN ('pending','rejected')
  )
);

-- Owners can update images while the review is not approved
CREATE POLICY "Owners update images for own unapproved review"
ON public.review_images
FOR UPDATE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_images.review_id
      AND r.user_id = auth.uid()
      AND r.status IN ('pending','rejected')
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_images.review_id
      AND r.user_id = auth.uid()
      AND r.status IN ('pending','rejected')
  )
);

-- Owners can delete images while the review is not approved
CREATE POLICY "Owners delete images for own unapproved review"
ON public.review_images
FOR DELETE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_images.review_id
      AND r.user_id = auth.uid()
      AND r.status IN ('pending','rejected')
  )
);

-- 2) Storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
SELECT 'review-images', 'review-images', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'review-images'
);

-- Storage policies
CREATE POLICY "Review images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Users can upload their own review images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own review images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own review images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
