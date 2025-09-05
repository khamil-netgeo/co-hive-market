-- Phase 1: Create testimonials and site statistics system
-- This will enable dynamic content management for the landing page

-- Create testimonials table for managing customer testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site statistics table for dynamic stats display
CREATE TABLE public.site_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key TEXT NOT NULL UNIQUE,
  stat_value TEXT NOT NULL,
  stat_label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page content table for managing static page content
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'html', 'json'
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_slug, content_key)
);

-- Enable RLS on all tables
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials
CREATE POLICY "Public can view active testimonials" 
ON public.testimonials 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage testimonials" 
ON public.testimonials 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for site statistics
CREATE POLICY "Public can view active site statistics" 
ON public.site_statistics 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage site statistics" 
ON public.site_statistics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for page content
CREATE POLICY "Public can view active page content" 
ON public.page_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage page content" 
ON public.page_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Add updated_at trigger for testimonials
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for site_statistics  
CREATE TRIGGER update_site_statistics_updated_at
BEFORE UPDATE ON public.site_statistics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for page_content
CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial testimonials data (migrating from hardcoded content)
INSERT INTO public.testimonials (name, role, avatar_url, rating, content, is_featured, display_order) VALUES
('Sarah Chen', 'Local Business Owner', 'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=100&h=100&fit=crop&crop=face', 5, 'This marketplace transformed my small bakery business. The community support and profit-sharing model helped me grow faster than I ever imagined.', true, 1),
('Marcus Rodriguez', 'Freelance Designer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 5, 'I''ve found amazing clients through this platform. The quality of connections and the fair fee structure make it my go-to for finding new projects.', true, 2),
('Emma Thompson', 'Regular Customer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', 5, 'Love supporting local vendors! The quality is outstanding and knowing my purchases help grow the community makes every order feel meaningful.', true, 3);

-- Insert initial site statistics (realistic numbers based on actual database content)
INSERT INTO public.site_statistics (stat_key, stat_value, stat_label, display_order) VALUES
('active_vendors', '2', 'Active Vendors', 1),
('products_listed', '4', 'Products Listed', 2),
('customer_satisfaction', '98%', 'Customer Satisfaction', 3),
('community_revenue', '$1,240', 'Community Revenue', 4),
('total_communities', '5', 'Active Communities', 5),
('platform_rating', '4.8/5', 'Platform Rating', 6),
('total_members', '150+', 'Community Members', 7);

-- Insert initial page content for hero section
INSERT INTO public.page_content (page_slug, content_key, content_value, content_type) VALUES
('hero', 'main_headline', 'Discover Local Products & Services', 'text'),
('hero', 'sub_headline', 'Connect with trusted local vendors, discover unique products, and book professional services. Every purchase supports your community''s growth.', 'text'),
('hero', 'search_placeholder', 'Search for products, services, or vendors...', 'text'),
('hero', 'trust_verified_vendors', 'Verified Vendors', 'text'),
('hero', 'trust_rating', '4.8/5 Rating', 'text'),
('hero', 'trust_members', '150+ Members', 'text');