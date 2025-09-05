-- Create process_steps table for How It Works section
CREATE TABLE public.process_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(step_number)
);

-- Enable Row Level Security
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view active process steps" 
ON public.process_steps 
FOR SELECT 
USING (is_active = true);

-- Create policies for superadmin management
CREATE POLICY "Superadmins can manage process steps" 
ON public.process_steps 
FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_process_steps_updated_at
BEFORE UPDATE ON public.process_steps
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_updated_at();

-- Insert initial data based on current hardcoded content
INSERT INTO public.process_steps (step_number, title, description, icon_name, display_order) VALUES
(1, 'Join a Community', 'Vendors, buyers, and riders attach to a local community that shares in every transaction. Choose your neighborhood and start building connections.', 'user-plus', 1),
(2, 'Trade & Contribute', 'Product sales, bookings, time-based gigs, and learning all generate community profit. Every transaction strengthens the local economy.', 'dollar-sign', 2),
(3, 'Grow Together', 'The main cooperative collects a small fee to fund programs and new business growth. Success is shared, communities thrive.', 'trending-up', 3);