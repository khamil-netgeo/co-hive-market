-- Fix the policy issue by dropping and recreating
DROP POLICY IF EXISTS "Public can view inventory for active products" ON public.product_inventory;

CREATE POLICY "Public can view inventory for active products" ON public.product_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_inventory.product_id 
            AND p.status = 'active'
        )
    );