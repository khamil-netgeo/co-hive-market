-- Add admin/superadmin read policies for products and subscribers

-- Allow admins and superadmins to view all products (bypass status filter)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'products' 
      AND policyname = 'Admins can view all products'
  ) THEN
    CREATE POLICY "Admins can view all products"
    ON public.products
    FOR SELECT
    USING (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;
END $$;

-- Allow admins and superadmins to view all subscribers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscribers' 
      AND policyname = 'Admins can view all subscriptions'
  ) THEN
    CREATE POLICY "Admins can view all subscriptions"
    ON public.subscribers
    FOR SELECT
    USING (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'superadmin'::app_role)
    );
  END IF;
END $$;