
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TargetType = "product" | "service";

export type ReviewRecord = {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  helpful_count?: number;
  quality_rating?: number;
  service_rating?: number;
  delivery_rating?: number;
  value_rating?: number;
};

export type RatingSummary = {
  avg_rating: number | null;
  review_count: number | null;
};

export type ReviewImage = {
  id: string;
  review_id: string;
  user_id: string;
  url: string;
  created_at: string;
};

export type ReviewResponse = {
  id: string;
  review_id: string;
  vendor_user_id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
};

export type ReviewVote = {
  id: string;
  review_id: string;
  user_id: string;
  vote_type: 'helpful' | 'not_helpful';
  created_at: string;
};

export type ReviewTemplate = {
  id: string;
  target_type: TargetType;
  title: string;
  template_text: string;
  rating_suggestions: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReviewerProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  verification_level: 'unverified' | 'email_verified' | 'phone_verified' | 'identity_verified' | 'premium_buyer';
  total_reviews: number;
  average_rating_given: number;
  helpful_votes_received: number;
  reviewer_rank: string;
};

function getSummaryView(targetType: TargetType) {
  return targetType === "product" ? "product_rating_summary" : "service_rating_summary";
}

function getSummaryKey(targetType: TargetType) {
  return targetType === "product" ? "product_id" : "service_id";
}

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);
  return userId;
}

export function useReviewSummary(targetType: TargetType, targetId: string): UseQueryResult<RatingSummary, Error> {
  return useQuery({
    queryKey: ["review-summary", targetType, targetId] as const,
    queryFn: async (): Promise<RatingSummary> => {
      const view = getSummaryView(targetType);
      const key = getSummaryKey(targetType);
      const { data, error } = await (supabase as any)
        .from(view)
        .select("*")
        .eq(key, targetId)
        .maybeSingle();
      if (error) throw error as Error;
      return (data ?? { avg_rating: null, review_count: 0 }) as RatingSummary;
    },
  }) as UseQueryResult<RatingSummary, Error>;
}

export function useApprovedReviews(
  targetType: TargetType, 
  targetId: string,
  sortBy: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low' = 'newest'
): UseQueryResult<ReviewRecord[], Error> {
  return useQuery({
    queryKey: ["approved-reviews", targetType, targetId, sortBy] as const,
    queryFn: async (): Promise<ReviewRecord[]> => {
      let query = (supabase as any)
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("status", "approved");

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order("created_at", { ascending: true });
          break;
        case 'helpful':
          query = query.order("helpful_count", { ascending: false });
          break;
        case 'rating_high':
          query = query.order("rating", { ascending: false });
          break;
        case 'rating_low':
          query = query.order("rating", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error as Error;
      return (data ?? []) as ReviewRecord[];
    },
  }) as UseQueryResult<ReviewRecord[], Error>;
}

export function useOwnReview(targetType: TargetType, targetId: string): UseQueryResult<ReviewRecord | null, Error> {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ["own-review", targetType, targetId, userId] as const,
    enabled: !!userId,
    queryFn: async (): Promise<ReviewRecord | null> => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error as Error;
      return (data ?? null) as ReviewRecord | null;
    },
  }) as UseQueryResult<ReviewRecord | null, Error>;
}

type SubmitPayload = {
  targetType: TargetType;
  targetId: string;
  rating: number;
  title?: string;
  body?: string;
  quality_rating?: number;
  service_rating?: number;
  delivery_rating?: number;
  value_rating?: number;
};

export function useSubmitReview() {
  const qc = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (payload: SubmitPayload) => {
      if (!userId) {
        const err = new Error("Please sign in to submit a review.");
        throw err;
      }
      const { targetType, targetId, rating, title, body, quality_rating, service_rating, delivery_rating, value_rating } = payload;
      const { data, error } = await (supabase as any)
        .from("reviews")
        .upsert(
          [
            {
              user_id: userId,
              target_type: targetType,
              target_id: targetId,
              rating,
              title: title ?? null,
              body: body ?? null,
              quality_rating: quality_rating ?? null,
              service_rating: service_rating ?? null,
              delivery_rating: delivery_rating ?? null,
              value_rating: value_rating ?? null,
            },
          ],
          { onConflict: "user_id,target_type,target_id" }
        )
        .select()
        .maybeSingle();
      if (error) throw error as Error;
      return data as ReviewRecord | null;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["own-review", variables.targetType, variables.targetId] });
      qc.invalidateQueries({ queryKey: ["approved-reviews", variables.targetType, variables.targetId] });
      qc.invalidateQueries({ queryKey: ["review-summary", variables.targetType, variables.targetId] });
    },
  });
}

export function useDeleteOwnDraftReview(targetType: TargetType, targetId: string) {
  const qc = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in.");
      const { error } = await (supabase as any)
        .from("reviews")
        .delete()
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .in("status", ["pending", "rejected"]);
      if (error) throw error as Error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["own-review", targetType, targetId] });
      qc.invalidateQueries({ queryKey: ["approved-reviews", targetType, targetId] });
      qc.invalidateQueries({ queryKey: ["review-summary", targetType, targetId] });
    },
  });
}

export function useCanSubmitReview(targetType: TargetType, targetId: string) {
  const userId = useCurrentUserId();
  const { data: ownReview } = useOwnReview(targetType, targetId);

  const { data: eligible, isLoading: checkingEligibility } = useQuery({
    queryKey: ["can-submit-review", targetType, targetId, userId] as const,
    enabled: !!userId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await (supabase as any).rpc("can_submit_review", {
        _target_type: targetType,
        _target_id: targetId,
      });
      if (error) throw error as Error;
      return Boolean(data);
    },
  }) as UseQueryResult<boolean, Error> as any;

  const canSubmit = useMemo(() => {
    if (!userId) return false;
    if (ownReview?.status === "approved") return false;
    if (checkingEligibility) return false;
    return !!eligible;
  }, [userId, ownReview, eligible, checkingEligibility]);

  return { canSubmit, userId, ownReview, eligible: !!eligible, checkingEligibility };
}

export function useReviewImages(reviewId?: string): UseQueryResult<ReviewImage[], Error> {
  return useQuery({
    queryKey: ["review-images", reviewId] as const,
    enabled: !!reviewId,
    queryFn: async (): Promise<ReviewImage[]> => {
      if (!reviewId) return [];
      const { data, error } = await (supabase as any)
        .from("review_images")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: false });
      if (error) throw error as Error;
      return (data ?? []) as ReviewImage[];
    },
  }) as UseQueryResult<ReviewImage[], Error>;
}

export function useAddReviewImage(reviewId?: string) {
  const qc = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      if (!reviewId) throw new Error("Missing review ID");
      if (!userId) throw new Error("Please sign in.");
      const { error } = await (supabase as any)
        .from("review_images")
        .insert({ review_id: reviewId, user_id: userId, url });
      if (error) throw error as Error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-images", reviewId] });
    },
  });
}

export function useRemoveReviewImage(reviewId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase as any)
        .from("review_images")
        .delete()
        .eq("id", id);
      if (error) throw error as Error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-images", reviewId] });
    },
  });
}

// Review responses hooks
export function useReviewResponses(reviewId: string): UseQueryResult<ReviewResponse[], Error> {
  return useQuery({
    queryKey: ["review-responses", reviewId] as const,
    queryFn: async (): Promise<ReviewResponse[]> => {
      const { data, error } = await (supabase as any)
        .from("review_responses")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });
      if (error) throw error as Error;
      return (data ?? []) as ReviewResponse[];
    },
  }) as UseQueryResult<ReviewResponse[], Error>;
}

export function useSubmitReviewResponse() {
  const qc = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async ({ reviewId, responseText }: { reviewId: string; responseText: string }) => {
      if (!userId) throw new Error("Please sign in to respond to reviews.");
      
      const { data, error } = await (supabase as any)
        .from("review_responses")
        .insert({
          review_id: reviewId,
          vendor_user_id: userId,
          response_text: responseText,
        })
        .select()
        .single();
      
      if (error) throw error as Error;
      return data as ReviewResponse;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["review-responses", data.review_id] });
    },
  });
}

// Review voting hooks
export function useReviewVote(reviewId: string): UseQueryResult<ReviewVote | null, Error> {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ["review-vote", reviewId, userId] as const,
    enabled: !!userId,
    queryFn: async (): Promise<ReviewVote | null> => {
      if (!userId) return null;
      const { data, error } = await (supabase as any)
        .from("review_votes")
        .select("*")
        .eq("review_id", reviewId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error as Error;
      return (data ?? null) as ReviewVote | null;
    },
  }) as UseQueryResult<ReviewVote | null, Error>;
}

export function useVoteOnReview() {
  const qc = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async ({ reviewId, voteType }: { reviewId: string; voteType: 'helpful' | 'not_helpful' }) => {
      if (!userId) throw new Error("Please sign in to vote on reviews.");
      
      const { data, error } = await (supabase as any)
        .from("review_votes")
        .upsert(
          {
            review_id: reviewId,
            user_id: userId,
            vote_type: voteType,
          },
          { onConflict: "review_id,user_id" }
        )
        .select()
        .single();
      
      if (error) throw error as Error;
      return data as ReviewVote;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["review-vote", data.review_id] });
      qc.invalidateQueries({ queryKey: ["approved-reviews"] });
    },
  });
}

export function useRemoveReviewVote() {
  const qc = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async ({ reviewId }: { reviewId: string }) => {
      if (!userId) throw new Error("Please sign in.");
      
      const { error } = await (supabase as any)
        .from("review_votes")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", userId);
      
      if (error) throw error as Error;
      return true;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["review-vote", variables.reviewId] });
      qc.invalidateQueries({ queryKey: ["approved-reviews"] });
    },
  });
}

// Review templates hooks
export function useReviewTemplates(targetType: TargetType): UseQueryResult<ReviewTemplate[], Error> {
  return useQuery({
    queryKey: ["review-templates", targetType] as const,
    queryFn: async (): Promise<ReviewTemplate[]> => {
      const { data, error } = await (supabase as any)
        .from("review_templates")
        .select("*")
        .eq("target_type", targetType)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error as Error;
      return (data ?? []) as ReviewTemplate[];
    },
  }) as UseQueryResult<ReviewTemplate[], Error>;
}

// Reviewer profile hooks
export function useReviewerProfile(userId: string): UseQueryResult<ReviewerProfile | null, Error> {
  return useQuery({
    queryKey: ["reviewer-profile", userId] as const,
    queryFn: async (): Promise<ReviewerProfile | null> => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, display_name, avatar_url, verification_level, total_reviews, average_rating_given, helpful_votes_received, reviewer_rank")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error as Error;
      return (data ?? null) as ReviewerProfile | null;
    },
  }) as UseQueryResult<ReviewerProfile | null, Error>;
}

// Review analytics hooks for vendors
export function useReviewAnalytics(targetType: TargetType, targetId: string): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["review-analytics", targetType, targetId] as const,
    queryFn: async () => {
      const { data: reviews, error } = await (supabase as any)
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("status", "approved");
      
      if (error) throw error as Error;
      
      const analytics = {
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0,
        ratingDistribution: reviews.reduce((acc: Record<number, number>, r: any) => {
          acc[r.rating] = (acc[r.rating] || 0) + 1;
          return acc;
        }, {}),
        monthlyTrend: reviews.reduce((acc: Record<string, number>, r: any) => {
          const month = new Date(r.created_at).toISOString().slice(0, 7);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {}),
        averageDetailedRatings: {
          quality: reviews.filter((r: any) => r.quality_rating).reduce((sum: number, r: any) => sum + r.quality_rating, 0) / reviews.filter((r: any) => r.quality_rating).length || 0,
          service: reviews.filter((r: any) => r.service_rating).reduce((sum: number, r: any) => sum + r.service_rating, 0) / reviews.filter((r: any) => r.service_rating).length || 0,
          delivery: reviews.filter((r: any) => r.delivery_rating).reduce((sum: number, r: any) => sum + r.delivery_rating, 0) / reviews.filter((r: any) => r.delivery_rating).length || 0,
          value: reviews.filter((r: any) => r.value_rating).reduce((sum: number, r: any) => sum + r.value_rating, 0) / reviews.filter((r: any) => r.value_rating).length || 0,
        },
        helpfulnessStats: {
          totalVotes: reviews.reduce((sum: number, r: any) => sum + (r.helpful_count || 0), 0),
          averageHelpfulness: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.helpful_count || 0), 0) / reviews.length : 0,
        }
      };
      
      return analytics;
    },
  }) as UseQueryResult<any, Error>;
}
