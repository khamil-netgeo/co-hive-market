-- Create RLS policies for product-images bucket
-- Allow public read access to product images
CREATE POLICY "Public read access for product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- Allow vendors to upload images to their own folder
CREATE POLICY "Vendors can upload to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT v.id::text 
    FROM vendors v 
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to update images in their own folder
CREATE POLICY "Vendors can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT v.id::text 
    FROM vendors v 
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to delete images in their own folder
CREATE POLICY "Vendors can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT v.id::text 
    FROM vendors v 
    WHERE v.user_id = auth.uid()
  )
);

-- Create RLS policies for service-images bucket as well
-- Allow public read access to service images
CREATE POLICY "Public read access for service images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

-- Allow vendors to upload images to their own folder
CREATE POLICY "Vendors can upload service images to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT v.id::text 
    FROM vendors v 
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to update service images in their own folder
CREATE POLICY "Vendors can update their own service images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT v.id::text 
    FROM vendors v 
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to delete service images in their own folder
CREATE POLICY "Vendors can delete their own service images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT v.id::text 
    FROM vendors v 
    WHERE v.user_id = auth.uid()
  )
);