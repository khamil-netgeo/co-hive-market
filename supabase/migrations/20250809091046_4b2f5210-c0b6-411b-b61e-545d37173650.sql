-- 1) Add media fields to products and vendor_services, and social links to vendors
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.vendor_services
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- 2) Create storage buckets for product and service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for public read and user-owned write paths
-- Public read (select) for product-images
CREATE POLICY IF NOT EXISTS "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Public read (select) for service-images
CREATE POLICY IF NOT EXISTS "Public can view service images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-images');

-- Upload (insert) to own folder for product-images
CREATE POLICY IF NOT EXISTS "Users can upload product images to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update (update) to own folder for product-images
CREATE POLICY IF NOT EXISTS "Users can update product images in own folder"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete (delete) from own folder for product-images
CREATE POLICY IF NOT EXISTS "Users can delete product images in own folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Upload (insert) to own folder for service-images
CREATE POLICY IF NOT EXISTS "Users can upload service images to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update (update) to own folder for service-images
CREATE POLICY IF NOT EXISTS "Users can update service images in own folder"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete (delete) from own folder for service-images
CREATE POLICY IF NOT EXISTS "Users can delete service images in own folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
