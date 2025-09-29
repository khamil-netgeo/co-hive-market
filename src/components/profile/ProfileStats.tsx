import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingBag, Star, Award } from "lucide-react";

interface ProfileStatsProps {
  userId?: string;
}

export default function ProfileStats({ userId }: ProfileStatsProps) {
  const [stats, setStats] = useState({
    communities: 0,
    orders: 0,
    reviews: 0,
    completion: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      try {
        const [communitiesRes, ordersRes, reviewsRes, profileRes] = await Promise.all([
          supabase
            .from("community_members")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("buyer_user_id", userId),
          supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        // Calculate profile completion
        let completionFields = 0;
        const totalFields = 7; // email, phone, address, city, state, postcode, country
        
        if (profileRes.data) {
          const profile = profileRes.data;
          if (profile.phone) completionFields++;
          if (profile.address_line1) completionFields++;
          if (profile.city) completionFields++;
          if (profile.state) completionFields++;
          if (profile.postcode) completionFields++;
          if (profile.country) completionFields++;
          if (profile.latitude && profile.longitude) completionFields++;
        }

        const completion = Math.round((completionFields / totalFields) * 100);

        setStats({
          communities: communitiesRes.count || 0,
          orders: ordersRes.count || 0,
          reviews: reviewsRes.count || 0,
          completion,
        });
      } catch (error) {
        console.error("Error loading profile stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  const profileStats = [
    {
      title: "Communities Joined",
      value: loading ? "..." : stats.communities,
      description: "Active memberships",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Total Orders",
      value: loading ? "..." : stats.orders,
      description: "All-time purchases",
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      title: "Reviews Written",
      value: loading ? "..." : stats.reviews,
      description: "Product feedback",
      icon: <Star className="h-4 w-4" />,
    },
    {
      title: "Profile Complete",
      value: loading ? "..." : `${stats.completion}%`,
      description: stats.completion === 100 ? "Fully completed" : "Add more info",
      trend: stats.completion >= 80 ? "Complete" : stats.completion >= 50 ? "Good progress" : "Get started",
      icon: <Award className="h-4 w-4" />,
    },
  ];

  return profileStats;
}