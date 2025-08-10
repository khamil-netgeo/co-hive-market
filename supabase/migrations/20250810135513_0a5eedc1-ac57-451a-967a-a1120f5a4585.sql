-- 5) Enable realtime for rider-related tables
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.rider_profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already there
DO $$
BEGIN
    -- Check and add deliveries
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'deliveries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
    END IF;
    
    -- Check and add delivery_assignments  
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'delivery_assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
    END IF;
    
    -- Check and add rider_profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'rider_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
    END IF;
END $$;