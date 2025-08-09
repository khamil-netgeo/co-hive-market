-- Categories and linking tables migration (fixed trigger syntax)

-- 1) Categories core table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'both', -- 'product' | 'service' | 'both'
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Ensure uniqueness for slugs
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug);
CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS categories_active_idx ON public.categories (is_active);

-- Timestamps trigger
CREATE TRIGGER trg_update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Join table: product_categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX IF NOT EXISTS product_categories_category_idx ON public.product_categories (category_id);

-- 3) Join table: service_categories (links vendor_services -> categories)
CREATE TABLE IF NOT EXISTS public.service_categories (
  service_id UUID NOT NULL REFERENCES public.vendor_services(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (service_id, category_id)
);
CREATE INDEX IF NOT EXISTS service_categories_category_idx ON public.service_categories (category_id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
-- Public can read active categories
CREATE POLICY "Public can read active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

-- Only superadmins manage categories
CREATE POLICY "Superadmins manage categories"
ON public.categories
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Policies for product_categories
-- Public can view product categories when product is active
CREATE POLICY "Public select product categories for active products"
ON public.product_categories
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.products p
  WHERE p.id = product_categories.product_id
    AND p.status = 'active'::product_status
));

-- Vendors/admins manage categories for their own products
CREATE POLICY "Vendors manage product categories"
ON public.product_categories
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.vendors v ON v.id = p.vendor_id
  WHERE p.id = product_categories.product_id
    AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.vendors v ON v.id = p.vendor_id
  WHERE p.id = product_categories.product_id
    AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
));

-- Policies for service_categories
-- Public can view service categories when service is active
CREATE POLICY "Public select service categories for active services"
ON public.service_categories
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendor_services s
  WHERE s.id = service_categories.service_id
    AND s.status = 'active'
));

-- Vendors/admins manage categories for their own services
CREATE POLICY "Vendors manage service categories"
ON public.service_categories
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.vendor_services s
  JOIN public.vendors v ON v.id = s.vendor_id
  WHERE s.id = service_categories.service_id
    AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vendor_services s
  JOIN public.vendors v ON v.id = s.vendor_id
  WHERE s.id = service_categories.service_id
    AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
));