-- Create stakeholder_roles table for managing homepage stakeholder cards
CREATE TABLE public.stakeholder_roles (
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
ALTER TABLE public.stakeholder_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active stakeholder roles" 
ON public.stakeholder_roles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage stakeholder roles" 
ON public.stakeholder_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_stakeholder_roles_updated_at
BEFORE UPDATE ON public.stakeholder_roles
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_updated_at();

-- Insert initial data based on current hardcoded content
INSERT INTO public.stakeholder_roles (name, description, icon_name, sort_order) VALUES
('Vendors', 'List your products and services to reach customers in your community. Grow your business with our comprehensive seller tools.', 'store', 1),
('Delivery Partners', 'Earn flexible income by delivering orders in your area. Join our network of trusted delivery professionals.', 'truck', 2),
('Buyers', 'Discover amazing products and services from local vendors. Support your community while getting what you need.', 'shopping-bag', 3),
('Community Leaders', 'Build and manage thriving local communities. Connect vendors and buyers while earning from every transaction.', 'users', 4);