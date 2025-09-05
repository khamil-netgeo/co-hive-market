import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLandingCategories = () => {
  return useQuery({
    queryKey: ['landing-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data as LandingCategory[];
    },
  });
};