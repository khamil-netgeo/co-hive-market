-- 1) Ensure vendors are automatically members of their community (member_type = 'vendor')
-- Create a trigger function that upserts a community_members row when a vendor is created
CREATE OR REPLACE FUNCTION public.ensure_vendor_is_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Insert membership only if it does not already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = NEW.community_id
      AND cm.user_id = NEW.user_id
      AND cm.member_type = 'vendor'::public.member_type
  ) THEN
    INSERT INTO public.community_members (community_id, user_id, member_type)
    VALUES (NEW.community_id, NEW.user_id, 'vendor'::public.member_type);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on vendors insert
DROP TRIGGER IF EXISTS trg_ensure_vendor_is_member ON public.vendors;
CREATE TRIGGER trg_ensure_vendor_is_member
AFTER INSERT ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.ensure_vendor_is_member();