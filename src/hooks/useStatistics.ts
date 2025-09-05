import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SiteStatistic {
  id: string;
  stat_key: string;
  stat_value: string;
  stat_label: string;
  display_order: number;
}

export const useStatistics = () => {
  return useQuery({
    queryKey: ["site-statistics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_statistics")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching site statistics:", error);
        throw error;
      }

      return data as SiteStatistic[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get specific stats for hero section
export const useHeroStats = () => {
  return useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_statistics")
        .select("*")
        .eq("is_active", true)
        .in("stat_key", ["active_vendors", "products_listed", "customer_satisfaction", "community_revenue"])
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching hero statistics:", error);
        throw error;
      }

      return data as SiteStatistic[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};