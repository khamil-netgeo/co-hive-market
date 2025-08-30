-- Create review_responses table for vendor replies
CREATE TABLE public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  vendor_user_id UUID NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review_votes table for helpfulness voting
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_responses
CREATE POLICY "Vendor owners create responses" ON public.review_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      JOIN public.products p ON (r.target_type = 'product' AND r.target_id = p.id)
      JOIN public.vendors v ON (v.id = p.vendor_id)
      WHERE r.id = review_responses.review_id 
        AND v.user_id = auth.uid()
        AND r.status = 'approved'
    ) OR EXISTS (
      SELECT 1 FROM public.reviews r
      JOIN public.vendor_services s ON (r.target_type = 'service' AND r.target_id = s.id)
      JOIN public.vendors v ON (v.id = s.vendor_id)
      WHERE r.id = review_responses.review_id 
        AND v.user_id = auth.uid()
        AND r.status = 'approved'
    )
  );

CREATE POLICY "Public can view responses" ON public.review_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_responses.review_id AND r.status = 'approved'
    )
  );

CREATE POLICY "Vendor owners update/delete responses" ON public.review_responses
  FOR ALL USING (vendor_user_id = auth.uid());

-- RLS policies for review_votes
CREATE POLICY "Users vote on reviews" ON public.review_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own votes" ON public.review_votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users delete own votes" ON public.review_votes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Public can view vote counts" ON public.review_votes
  FOR SELECT USING (true);

-- Add indexes for performance
CREATE INDEX idx_review_responses_review_id ON public.review_responses(review_id);
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

-- Add helpful_count column to reviews table for caching
ALTER TABLE public.reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;

-- Function to update helpful count
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.reviews 
    SET helpful_count = (
      SELECT COUNT(*) FROM public.review_votes 
      WHERE review_id = NEW.review_id AND vote_type = 'helpful'
    )
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews 
    SET helpful_count = (
      SELECT COUNT(*) FROM public.review_votes 
      WHERE review_id = OLD.review_id AND vote_type = 'helpful'
    )
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for helpful count updates
CREATE TRIGGER trg_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_helpful_count();

-- Add updated_at trigger for review_responses
CREATE TRIGGER trg_review_responses_updated_at
  BEFORE UPDATE ON public.review_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_updated_at();