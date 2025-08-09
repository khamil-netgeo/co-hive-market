-- Add store settings fields to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Create a public bucket for store logos (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for store logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read store logos'
  ) THEN
    CREATE POLICY "Public read store logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'store-logos');
  END IF;
END$$;

-- Upload policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own store logos'
  ) THEN
    CREATE POLICY "Users can upload own store logos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'store-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END$$;

-- Update policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own store logos'
  ) THEN
    CREATE POLICY "Users can update own store logos"
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
  END IF;
END$$;

-- Delete policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own store logos'
  ) THEN
    CREATE POLICY "Users can delete own store logos"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'store-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END$$;
