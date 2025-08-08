-- Enable realtime by setting REPLICA IDENTITY FULL and adding tables to supabase_realtime publication

-- 1) community_members
ALTER TABLE public.community_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;

-- 2) vendors
ALTER TABLE public.vendors REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;

-- 3) communities
ALTER TABLE public.communities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;

-- 4) products
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;