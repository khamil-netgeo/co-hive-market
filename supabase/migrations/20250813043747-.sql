-- Fix vendors policy using correct column name
DROP POLICY IF EXISTS "Public can read active vendors" ON public.vendors;
CREATE POLICY "Public can read active vendors"
ON public.vendors
FOR SELECT
USING (COALESCE(active, true) = true);