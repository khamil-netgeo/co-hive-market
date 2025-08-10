-- 6) Add delivery preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS delivery_preference TEXT 
CHECK (delivery_preference IN ('auto', 'prefer_rider', 'prefer_easyparcel')) 
DEFAULT 'auto';