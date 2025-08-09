-- Add member types (safe if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_type' AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE public.member_type ADD VALUE 'manager';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_type' AND e.enumlabel = 'buyer'
  ) THEN
    ALTER TYPE public.member_type ADD VALUE 'buyer';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_type' AND e.enumlabel = 'vendor'
  ) THEN
    ALTER TYPE public.member_type ADD VALUE 'vendor';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_type' AND e.enumlabel = 'rider'
  ) THEN
    ALTER TYPE public.member_type ADD VALUE 'rider';
  END IF;
END $$;

-- Helper: check if user is manager of a community
CREATE OR REPLACE FUNCTION public.is_manager_of_community(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members cm
    WHERE cm.community_id = _community_id
      AND cm.user_id = _user_id
      AND cm.member_type = 'manager'::public.member_type
  );
$$;

-- Vendors: allow community managers to read/update vendors in their community
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vendors' AND policyname = 'Managers select vendors in their community'
  ) THEN
    CREATE POLICY "Managers select vendors in their community"
    ON public.vendors
    FOR SELECT
    USING (public.is_manager_of_community(community_id, auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vendors' AND policyname = 'Managers update vendors in their community'
  ) THEN
    CREATE POLICY "Managers update vendors in their community"
    ON public.vendors
    FOR UPDATE
    USING (public.is_manager_of_community(community_id, auth.uid()))
    WITH CHECK (public.is_manager_of_community(community_id, auth.uid()));
  END IF;
END $$;

-- Products: allow managers to update/delete products that belong to vendors in their community
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Managers update products in their community'
  ) THEN
    CREATE POLICY "Managers update products in their community"
    ON public.products
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = products.vendor_id
        AND public.is_manager_of_community(v.community_id, auth.uid())
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = products.vendor_id
        AND public.is_manager_of_community(v.community_id, auth.uid())
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Managers delete products in their community'
  ) THEN
    CREATE POLICY "Managers delete products in their community"
    ON public.products
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = products.vendor_id
        AND public.is_manager_of_community(v.community_id, auth.uid())
    ));
  END IF;
END $$;

-- Vendor service plans: managers can view/update plans for vendors in their community
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vendor_service_plans' AND policyname = 'Managers select plans in their community'
  ) THEN
    CREATE POLICY "Managers select plans in their community"
    ON public.vendor_service_plans
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_plans.vendor_id
        AND public.is_manager_of_community(v.community_id, auth.uid())
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vendor_service_plans' AND policyname = 'Managers update plans in their community'
  ) THEN
    CREATE POLICY "Managers update plans in their community"
    ON public.vendor_service_plans
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_plans.vendor_id
        AND public.is_manager_of_community(v.community_id, auth.uid())
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_service_plans.vendor_id
        AND public.is_manager_of_community(v.community_id, auth.uid())
    ));
  END IF;
END $$;