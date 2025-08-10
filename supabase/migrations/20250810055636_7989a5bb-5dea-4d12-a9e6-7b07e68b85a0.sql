-- Ensure helper function to check vendor ownership without being blocked by RLS
CREATE OR REPLACE FUNCTION public.is_vendor_owner(_vendor_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = _vendor_id AND v.user_id = _user_id
  );
$$;

-- Add an additional permissive policy to allow vendor owners to insert products
-- without relying on cross-table RLS in the policy body
DROP POLICY IF EXISTS "Vendor owners insert products (helper)" ON public.products;
CREATE POLICY "Vendor owners insert products (helper)"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_vendor_owner(vendor_id, auth.uid()));