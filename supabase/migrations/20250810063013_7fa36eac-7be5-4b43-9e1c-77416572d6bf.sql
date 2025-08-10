-- Allow vendors to SELECT their own products (inactive/draft included)
CREATE POLICY "Vendors view own products or admin"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = products.vendor_id
      AND (
        v.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::public.app_role)
        OR has_role(auth.uid(), 'superadmin'::public.app_role)
      )
  )
);
