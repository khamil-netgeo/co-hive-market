-- Add detailed rating categories to reviews table
ALTER TABLE public.reviews 
ADD COLUMN quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
ADD COLUMN service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
ADD COLUMN delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
ADD COLUMN value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5);

-- Create review templates table
CREATE TABLE public.review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type review_target NOT NULL,
  title TEXT NOT NULL,
  template_text TEXT NOT NULL,
  rating_suggestions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on review_templates
ALTER TABLE public.review_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to active templates
CREATE POLICY "Public can view active review templates" ON public.review_templates
  FOR SELECT USING (is_active = true);

-- Create policy for admins to manage templates
CREATE POLICY "Admins manage review templates" ON public.review_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Insert default review templates
INSERT INTO public.review_templates (target_type, title, template_text, rating_suggestions) VALUES
('product', 'Quick Review', 'This product is [describe your experience]. The quality is [excellent/good/average/poor] and delivery was [fast/on time/slow]. I would [recommend/not recommend] it to others.', '{"quality_rating": 5, "delivery_rating": 5, "value_rating": 5}'),
('product', 'Detailed Review', 'I purchased this product because [reason]. The packaging was [describe packaging]. The product quality exceeded/met/fell short of my expectations because [explain]. The delivery experience was [describe delivery]. Overall, I am [very satisfied/satisfied/neutral/disappointed] with this purchase.', '{"quality_rating": 4, "service_rating": 4, "delivery_rating": 4, "value_rating": 4}'),
('service', 'Service Review', 'I booked this service for [occasion/reason]. The service provider was [professional/friendly/helpful]. The quality of work was [excellent/good/average/poor]. They completed the work [on time/early/late]. I would [definitely/probably/maybe/not] use this service again.', '{"quality_rating": 5, "service_rating": 5, "value_rating": 4}');

-- Add reviewer verification levels
CREATE TYPE public.reviewer_verification_level AS ENUM ('unverified', 'email_verified', 'phone_verified', 'identity_verified', 'premium_buyer');

-- Add reviewer stats to profiles table (assuming it exists)
-- We'll need to check if profiles table exists first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Create profiles table if it doesn't exist
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Policies for profiles
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);
      
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
      
    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Add reviewer verification and stats columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_level reviewer_verification_level DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating_given DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS helpful_votes_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviewer_rank TEXT DEFAULT 'New Reviewer';

-- Create function to update reviewer stats
CREATE OR REPLACE FUNCTION public.update_reviewer_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    -- Update reviewer stats when review is approved
    UPDATE public.profiles 
    SET 
      total_reviews = (
        SELECT COUNT(*) FROM public.reviews 
        WHERE user_id = NEW.user_id AND status = 'approved'
      ),
      average_rating_given = (
        SELECT AVG(rating) FROM public.reviews 
        WHERE user_id = NEW.user_id AND status = 'approved'
      ),
      reviewer_rank = CASE 
        WHEN (SELECT COUNT(*) FROM public.reviews WHERE user_id = NEW.user_id AND status = 'approved') >= 50 THEN 'Expert Reviewer'
        WHEN (SELECT COUNT(*) FROM public.reviews WHERE user_id = NEW.user_id AND status = 'approved') >= 25 THEN 'Top Reviewer'
        WHEN (SELECT COUNT(*) FROM public.reviews WHERE user_id = NEW.user_id AND status = 'approved') >= 10 THEN 'Experienced Reviewer'
        WHEN (SELECT COUNT(*) FROM public.reviews WHERE user_id = NEW.user_id AND status = 'approved') >= 5 THEN 'Active Reviewer'
        ELSE 'New Reviewer'
      END
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for reviewer stats updates
DROP TRIGGER IF EXISTS trg_update_reviewer_stats ON public.reviews;
CREATE TRIGGER trg_update_reviewer_stats
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviewer_stats();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_detailed_ratings ON public.reviews(quality_rating, service_rating, delivery_rating, value_rating);
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON public.profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_profiles_reviewer_stats ON public.profiles(total_reviews, reviewer_rank);

-- Add updated_at trigger for review_templates
CREATE TRIGGER trg_review_templates_updated_at
  BEFORE UPDATE ON public.review_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_updated_at();