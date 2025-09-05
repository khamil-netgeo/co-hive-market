-- Add unique constraint to prevent duplicate role assignments
-- This allows users to have multiple different roles in the same community
-- but prevents them from having the same role twice

-- First, remove any existing duplicates (if any)
DELETE FROM public.community_members a USING public.community_members b 
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.community_id = b.community_id 
AND a.member_type = b.member_type;

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_user_community_role_unique 
UNIQUE (user_id, community_id, member_type);