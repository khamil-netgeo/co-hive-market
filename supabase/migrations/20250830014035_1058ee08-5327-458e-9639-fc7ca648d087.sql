-- Fix function search path security issue by setting search_path for the function
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;