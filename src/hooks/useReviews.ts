
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

export function useApprovedReviews(targetType: TargetType, targetId: string): UseQueryResult<ReviewRecord[], Error> {
  return useQuery({
    queryKey: ["approved-reviews", targetType, targetId] as const,
    queryFn: async (): Promise<ReviewRecord[]> => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
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
      const { targetType, targetId, rating, title, body } = payload;
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
