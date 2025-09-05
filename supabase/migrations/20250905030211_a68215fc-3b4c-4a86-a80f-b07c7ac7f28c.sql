-- Create trust features table for the main trust cards
CREATE TABLE public.trust_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- lucide icon names like 'shield', 'credit-card'
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trust guarantees table for the guarantee items
CREATE TABLE public.trust_guarantees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guarantee_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trust_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_guarantees ENABLE ROW LEVEL SECURITY;

-- Create policies for trust_features
CREATE POLICY "Public can view active trust features" 
ON public.trust_features 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage trust features" 
ON public.trust_features 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create policies for trust_guarantees  
CREATE POLICY "Public can view active trust guarantees" 
ON public.trust_guarantees 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage trust guarantees" 
ON public.trust_guarantees 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trust_features_updated_at
BEFORE UPDATE ON public.trust_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trust_guarantees_updated_at
BEFORE UPDATE ON public.trust_guarantees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial trust features data (from current hardcoded content)
INSERT INTO public.trust_features (title, description, icon_name, display_order) VALUES
('Verified Vendors', 'All vendors go through our rigorous verification process', 'shield', 1),
('Secure Payments', 'Your payments are protected with enterprise-grade security', 'credit-card', 2),
('Reliable Delivery', 'Track your orders with our trusted delivery network', 'truck', 3),
('24/7 Support', 'Our community support team is always here to help', 'headphones', 4);

-- Insert initial trust guarantees data (from current hardcoded content)  
INSERT INTO public.trust_guarantees (guarantee_text, display_order) VALUES
('100% Satisfaction Guarantee', 1),
('Secure & Encrypted Transactions', 2),
('Verified Vendor Network', 3),
('Community-Backed Quality', 4),
('Fair Dispute Resolution', 5),
('Money-Back Protection', 6);