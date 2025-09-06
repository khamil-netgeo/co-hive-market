-- Add slug column to products table
ALTER TABLE public.products ADD COLUMN slug text;

-- Create unique index on slug for performance and uniqueness
CREATE UNIQUE INDEX products_slug_unique_idx ON public.products(slug) WHERE slug IS NOT NULL;

-- Function to generate URL-friendly slug from text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(trim(input_text));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  base_slug := left(base_slug, 50); -- Limit length
  
  -- Handle empty or invalid slugs
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'product';
  END IF;
  
  final_slug := base_slug;
  
  -- Handle duplicates by appending numbers
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Generate slugs for existing products
UPDATE public.products 
SET slug = public.generate_slug(name) 
WHERE slug IS NULL;

-- Trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_product_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate slug if it's empty and name exists
  IF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.name IS NOT NULL THEN
    NEW.slug := public.generate_slug(NEW.name);
  END IF;
  
  -- If slug was manually set, ensure uniqueness
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    -- Check if slug already exists for a different product
    IF EXISTS (
      SELECT 1 FROM public.products 
      WHERE slug = NEW.slug 
      AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
      NEW.slug := public.generate_slug(NEW.name);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto slug generation
CREATE TRIGGER trigger_auto_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_product_slug();