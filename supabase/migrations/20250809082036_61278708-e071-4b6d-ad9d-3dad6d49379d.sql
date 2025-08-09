-- Add store settings fields to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Create a public bucket for store logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for store-logos bucket
-- Public can view logos
CREATE POLICY IF NOT EXISTS "Public read store logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-logos');

-- Authenticated users can upload to a folder named by their user id
CREATE POLICY IF NOT EXISTS "Users can upload own store logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can update their own uploads
CREATE POLICY IF NOT EXISTS "Users can update own store logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'store-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'store-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can delete their own uploads
CREATE POLICY IF NOT EXISTS "Users can delete own store logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'store-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
