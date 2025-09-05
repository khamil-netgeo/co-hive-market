-- Fix function search path security issue
ALTER FUNCTION public.validate_password_strength(TEXT) SET search_path = public;

-- Create missing storage bucket for return photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('return-photos', 'return-photos', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for return photos
CREATE POLICY "Users can upload return photos for their own requests"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'return-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view return photos for their own requests"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'return-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage return photos"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'return-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- Create table for tracking refund transactions
CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_request_id UUID NOT NULL,
  order_id UUID NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'myr',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for refund transactions
CREATE POLICY "Users can view refunds for their own returns"
ON public.refund_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_return_requests orr
    WHERE orr.id = refund_transactions.return_request_id
      AND orr.buyer_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view refunds for their orders"
ON public.refund_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_return_requests orr
    JOIN public.orders o ON o.id = orr.order_id
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE orr.id = refund_transactions.return_request_id
      AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all refund transactions"
ON public.refund_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_refund_transactions_updated_at
BEFORE UPDATE ON public.refund_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();