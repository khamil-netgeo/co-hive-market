import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProductionLogging } from "./useProductionLogging";

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  member_discount_percent: number;
  location?: string;
  is_verified?: boolean;
}

interface CommunityScore {
  community: Community;
  score: number;
  reasons: string[];
}

export function useCommunityRecommendations(userId?: string) {
  const [recommendations, setRecommendations] = useState<CommunityScore[]>([]);
  const [loading, setLoading] = useState(false);
  const { info, error: logError } = useProductionLogging();

  const generateRecommendations = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      info("Generating community recommendations", 'engagement', { userId });

      // Get all available communities
      const { data: communities, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!communities || communities.length === 0) {
        setRecommendations([]);
        return;
      }

      // Get user's profile data for recommendations
      const { data: profile } = await supabase
        .from('profiles')
        .select('location, interests, preferences')
        .eq('id', userId)
        .single();

      // Get user's existing community memberships
      const { data: existingMemberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);

      const existingCommunityIds = existingMemberships?.map(m => m.community_id) || [];

      // Score each community
      const scoredCommunities: CommunityScore[] = await Promise.all(
        communities
          .filter(community => !existingCommunityIds.includes(community.id))
          .map(async (community) => {
            const score = await calculateCommunityScore(community, profile, userId);
            return score;
          })
      );

      // Sort by score and take top recommendations
      const topRecommendations = scoredCommunities
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setRecommendations(topRecommendations);
      info("Community recommendations generated", 'engagement', { 
        userId, 
        recommendationCount: topRecommendations.length 
      });

    } catch (error: any) {
      logError("Failed to generate community recommendations", 'engagement', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCommunityScore = async (
    community: Community, 
    userProfile: any,
    userId: string
  ): Promise<CommunityScore> => {
    let score = 0;
    const reasons: string[] = [];

    // Base score for all communities
    score += 10;

    // Verified communities get bonus points
    if (community.is_verified) {
      score += 20;
      reasons.push("Verified community");
    }

    // Member discount bonus
    if (community.member_discount_percent > 0) {
      score += community.member_discount_percent * 2;
      reasons.push(`${community.member_discount_percent}% member discount`);
    }

    // Location matching (if available)
    if (userProfile?.location && community.location) {
      if (userProfile.location.toLowerCase().includes(community.location.toLowerCase()) ||
          community.location.toLowerCase().includes(userProfile.location.toLowerCase())) {
        score += 30;
        reasons.push("Near your location");
      }
    }

    // Get community activity metrics
    try {
      // Member count
      const { count: memberCount } = await supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', community.id);

      if (memberCount) {
        if (memberCount > 100) {
          score += 15;
          reasons.push("Large active community");
        } else if (memberCount > 20) {
          score += 10;
          reasons.push("Growing community");
        } else if (memberCount > 5) {
          score += 5;
          reasons.push("Small tight-knit community");
        }
      }

      const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('community_id', community.id);

      const totalListings = productCount || 0;
      if (totalListings > 20) {
        score += 15;
        reasons.push("Many active listings");
      } else if (totalListings > 5) {
        score += 10;
        reasons.push("Several active listings");
      }

      // Recent activity bonus
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: recentActivity } = await supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', community.id)
        .gte('created_at', oneWeekAgo.toISOString());

      if (recentActivity && recentActivity > 0) {
        score += recentActivity * 5;
        reasons.push("Recent new members");
      }

    } catch (error) {
      // Don't fail the whole scoring if metrics fail
      console.warn('Error calculating community metrics:', error);
    }

    // Add some randomization to prevent always showing the same order
    score += Math.random() * 5;

    return {
      community,
      score,
      reasons: reasons.slice(0, 3) // Keep top 3 reasons
    };
  };

  useEffect(() => {
    if (userId) {
      generateRecommendations();
    }
  }, [userId]);

  return {
    recommendations,
    loading,
    refresh: generateRecommendations
  };
}