-- Create landing_categories table for managing homepage categories
CREATE TABLE public.landing_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active categories" 
ON public.landing_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage landing categories" 
ON public.landing_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_landing_categories_updated_at
BEFORE UPDATE ON public.landing_categories
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_updated_at();

-- Insert initial data based on current hardcoded content
INSERT INTO public.landing_categories (name, description, icon_name, sort_order) VALUES
('Shop Products', 'Discover locally-made goods and support community vendors with every purchase.', 'shopping-bag', 1),
('Book Services', 'Find trusted professionals for repairs, consulting, and specialized services.', 'wrench', 2),
('Become a Vendor', 'Start selling your products or services and grow your business with community support.', 'graduation-cap', 3);