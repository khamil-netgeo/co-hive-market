-- Phase 2: Feed performance indexes
-- Products: optimize active-with-video queries, by time and by community
CREATE INDEX IF NOT EXISTS products_status_created_at_active_videos_idx
  ON public.products (status, created_at DESC)
  WHERE video_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_community_status_created_at_active_videos_idx
  ON public.products (community_id, status, created_at DESC)
  WHERE video_url IS NOT NULL;

-- Optional: speed kind-specific filters for active items
CREATE INDEX IF NOT EXISTS products_product_kind_active_idx
  ON public.products (product_kind)
  WHERE status = 'active';

-- Vendors: quick lookup by community
CREATE INDEX IF NOT EXISTS vendors_community_id_idx
  ON public.vendors (community_id);

-- Vendor services: optimize active-with-video queries, by time and by vendor
CREATE INDEX IF NOT EXISTS vendor_services_status_created_at_active_videos_idx
  ON public.vendor_services (status, created_at DESC)
  WHERE video_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS vendor_services_vendor_status_created_at_active_videos_idx
  ON public.vendor_services (vendor_id, status, created_at DESC)
  WHERE video_url IS NOT NULL;