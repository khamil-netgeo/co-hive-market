-- Idempotent realtime setup: set REPLICA IDENTITY FULL and add to publication only if not already added

-- 1) community_members
ALTER TABLE public.community_members REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'community_members already in publication';
END $$;

-- 2) vendors
ALTER TABLE public.vendors REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'vendors already in publication';
END $$;

-- 3) communities
ALTER TABLE public.communities REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'communities already in publication';
END $$;

-- 4) products
ALTER TABLE public.products REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'products already in publication';
END $$;