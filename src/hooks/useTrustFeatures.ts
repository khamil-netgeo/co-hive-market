import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrustFeature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export const useTrustFeatures = () => {
  return useQuery({
    queryKey: ["trust-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trust_features")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching trust features:", error);
        throw error;
      }

      return data as TrustFeature[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for trust guarantees
interface TrustGuarantee {
  id: string;
  guarantee_text: string;
  display_order: number;
  is_active: boolean;
}

export const useTrustGuarantees = () => {
  return useQuery({
    queryKey: ["trust-guarantees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trust_guarantees")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching trust guarantees:", error);
        throw error;
      }

      return data as TrustGuarantee[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for real community statistics
export const useCommunityStats = () => {
  return useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      // Get actual member count from community_members table
      const { count: memberCount } = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true });

      // If no community members, fall back to profiles count
      let totalMembers = memberCount || 0;
      if (totalMembers === 0) {
        const { count: profileCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });
        totalMembers = profileCount || 0;
      }

      return {
        memberCount: totalMembers,
        displayText: totalMembers > 0 
          ? `Trusted by ${totalMembers.toLocaleString()}+ community members`
          : "Growing community of trusted members"
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent for real stats
  });
};