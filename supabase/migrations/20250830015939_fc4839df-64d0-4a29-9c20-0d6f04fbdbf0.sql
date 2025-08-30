-- Create condition enum for preloved items
CREATE TYPE product_condition_type AS ENUM (
  'like_new',
  'excellent', 
  'good',
  'fair',
  'poor'
);

-- Add condition-related fields to products table
ALTER TABLE public.products 
ADD COLUMN condition product_condition_type,
ADD COLUMN age_years integer,
ADD COLUMN original_price_cents integer,
ADD COLUMN wear_description text;

-- Add indexes for better query performance
CREATE INDEX idx_products_condition ON public.products(condition) WHERE condition IS NOT NULL;
CREATE INDEX idx_products_kind_condition ON public.products(product_kind, condition) WHERE product_kind = 'preloved';