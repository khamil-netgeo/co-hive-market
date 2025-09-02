-- Add unique constraint to prevent duplicate chat threads between buyer-vendor pairs
-- This ensures data integrity at the database level, not just application level

-- Create a unique index on the combination of buyer_user_id and vendor_id
-- We use a partial unique index to handle the nullable columns properly
CREATE UNIQUE INDEX idx_chat_threads_buyer_vendor_unique 
ON public.chat_threads (buyer_user_id, vendor_id) 
WHERE buyer_user_id IS NOT NULL AND vendor_id IS NOT NULL;

-- Add a comment to document the purpose
COMMENT ON INDEX public.idx_chat_threads_buyer_vendor_unique IS 
'Ensures each buyer-vendor pair has only one chat thread, preventing duplicates at database level';