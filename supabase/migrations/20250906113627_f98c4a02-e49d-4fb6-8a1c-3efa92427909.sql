-- Check if products table has inventory fields and add them if missing
-- Add stock_quantity, low_stock_threshold, and track_inventory columns to products table

DO $$
BEGIN
    -- Add stock_quantity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
    END IF;

    -- Add low_stock_threshold column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE public.products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
    END IF;

    -- Add track_inventory column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'track_inventory'
    ) THEN
        ALTER TABLE public.products ADD COLUMN track_inventory BOOLEAN DEFAULT true;
    END IF;

    -- Add reserved_quantity column if it doesn't exist (for inventory management)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'reserved_quantity'
    ) THEN
        ALTER TABLE public.products ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Create product_inventory table if it doesn't exist for better inventory tracking
CREATE TABLE IF NOT EXISTS public.product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    track_inventory BOOLEAN DEFAULT true,
    last_restock_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id)
);

-- Enable RLS on product_inventory
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for product_inventory
CREATE POLICY "Vendors can manage their product inventory" ON public.product_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.vendors v ON v.id = p.vendor_id
            WHERE p.id = product_inventory.product_id 
            AND (v.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
        )
    );

CREATE POLICY "Public can view inventory for active products" ON public.product_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_inventory.product_id 
            AND p.status = 'active'
        )
    );

-- Create trigger to update updated_at
CREATE OR REPLACE TRIGGER update_product_inventory_updated_at
    BEFORE UPDATE ON public.product_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION public.get_low_stock_products(vendor_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    vendor_id UUID,
    stock_quantity INTEGER,
    low_stock_threshold INTEGER,
    available_quantity INTEGER
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.vendor_id,
        COALESCE(pi.stock_quantity, p.stock_quantity, 0) as stock_quantity,
        COALESCE(pi.low_stock_threshold, p.low_stock_threshold, 5) as low_stock_threshold,
        COALESCE(pi.stock_quantity, p.stock_quantity, 0) - COALESCE(pi.reserved_quantity, p.reserved_quantity, 0) as available_quantity
    FROM public.products p
    LEFT JOIN public.product_inventory pi ON pi.product_id = p.id
    WHERE 
        p.status = 'active'
        AND COALESCE(pi.track_inventory, p.track_inventory, true) = true
        AND COALESCE(pi.stock_quantity, p.stock_quantity, 0) <= COALESCE(pi.low_stock_threshold, p.low_stock_threshold, 5)
        AND (vendor_id_param IS NULL OR p.vendor_id = vendor_id_param)
    ORDER BY 
        (COALESCE(pi.stock_quantity, p.stock_quantity, 0) - COALESCE(pi.low_stock_threshold, p.low_stock_threshold, 5)) ASC;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON public.product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity) WHERE track_inventory = true;
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON public.products(vendor_id, status);