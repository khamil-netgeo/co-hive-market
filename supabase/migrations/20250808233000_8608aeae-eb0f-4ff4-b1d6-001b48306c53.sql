-- 1) Vendors: optional member discount override (0..100)
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS member_discount_override_percent integer,
ADD CONSTRAINT vendors_member_discount_override_percent_range
  CHECK (member_discount_override_percent IS NULL OR member_discount_override_percent BETWEEN 0 AND 100);

-- 2) Vendor service subscription plans
CREATE TABLE IF NOT EXISTS public.vendor_service_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'myr',
  interval text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_service_plans_vendor_id ON public.vendor_service_plans(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_service_plans_status ON public.vendor_service_plans(status);

-- RLS
ALTER TABLE public.vendor_service_plans ENABLE ROW LEVEL SECURITY;

-- Policies: Public can view active plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_service_plans' AND policyname='Active plans are publicly readable'
  ) THEN
    CREATE POLICY "Active plans are publicly readable"
    ON public.vendor_service_plans
    FOR SELECT
    USING (status = 'active');
  END IF;
END $$;

-- Policies: Vendor owner or admin can view/manage all own plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_service_plans' AND policyname='Vendors/admins view own plans'
  ) THEN
    CREATE POLICY "Vendors/admins view own plans"
    ON public.vendor_service_plans
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = vendor_service_plans.vendor_id
          AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_service_plans' AND policyname='Vendors/admins insert plans'
  ) THEN
    CREATE POLICY "Vendors/admins insert plans"
    ON public.vendor_service_plans
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = vendor_service_plans.vendor_id
          AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_service_plans' AND policyname='Vendors/admins update plans'
  ) THEN
    CREATE POLICY "Vendors/admins update plans"
    ON public.vendor_service_plans
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = vendor_service_plans.vendor_id
          AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = vendor_service_plans.vendor_id
          AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vendor_service_plans' AND policyname='Vendors/admins delete plans'
  ) THEN
    CREATE POLICY "Vendors/admins delete plans"
    ON public.vendor_service_plans
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = vendor_service_plans.vendor_id
          AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
      )
    );
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vendor_service_plans_updated_at'
  ) THEN
    CREATE TRIGGER trg_vendor_service_plans_updated_at
    BEFORE UPDATE ON public.vendor_service_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Buyer subscriptions for vendor service plans
CREATE TABLE IF NOT EXISTS public.buyer_service_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_service_plan_id uuid NOT NULL REFERENCES public.vendor_service_plans(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_subscriptions_user_id ON public.buyer_service_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_subscriptions_plan_id ON public.buyer_service_subscriptions(vendor_service_plan_id);

ALTER TABLE public.buyer_service_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: Users view/manage their own subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='buyer_service_subscriptions' AND policyname='Users select own service subscriptions'
  ) THEN
    CREATE POLICY "Users select own service subscriptions"
    ON public.buyer_service_subscriptions
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='buyer_service_subscriptions' AND policyname='Users insert own service subscriptions'
  ) THEN
    CREATE POLICY "Users insert own service subscriptions"
    ON public.buyer_service_subscriptions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='buyer_service_subscriptions' AND policyname='Users update own service subscriptions'
  ) THEN
    CREATE POLICY "Users update own service subscriptions"
    ON public.buyer_service_subscriptions
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='buyer_service_subscriptions' AND policyname='Users delete own service subscriptions'
  ) THEN
    CREATE POLICY "Users delete own service subscriptions"
    ON public.buyer_service_subscriptions
    FOR DELETE
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Policies: Vendors/admins can view subscriptions for their plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='buyer_service_subscriptions' AND policyname='Vendors/admins select subscriptions for own plans'
  ) THEN
    CREATE POLICY "Vendors/admins select subscriptions for own plans"
    ON public.buyer_service_subscriptions
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.vendor_service_plans p
        JOIN public.vendors v ON v.id = p.vendor_id
        WHERE p.id = buyer_service_subscriptions.vendor_service_plan_id
          AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
      )
    );
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_buyer_service_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER trg_buyer_service_subscriptions_updated_at
    BEFORE UPDATE ON public.buyer_service_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;