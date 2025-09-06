-- Add vendor response functionality to reviews table
ALTER TABLE public.reviews 
ADD COLUMN vendor_response TEXT,
ADD COLUMN response_date TIMESTAMP WITH TIME ZONE;