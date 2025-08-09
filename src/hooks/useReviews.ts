
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useReviewSummary(targetType: TargetType, targetId: string) {
  return useQuery({
    queryKey: ["review-summary", targetType, targetId],
    queryFn: async () => {
      const view = getSummaryView(targetType);
      const key = getSummaryKey(targetType);
      const { data, error } = await supabase
        .from(view)
        .select("*")
        .eq(key, targetId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? { avg_rating: null, review_count: 0 }) as RatingSummary;
    },
  });
}

export function useApprovedReviews(targetType: TargetType, targetId: string) {
  return useQuery({
    queryKey: ["approved-reviews", targetType, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRecord[];
    },
  });
}

export function useOwnReview(targetType: TargetType, targetId: string) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ["own-review", targetType, targetId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ReviewRecord | null;
    },
  });
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
        // Throw so React Query handles it.
        throw err;
      }
      const { targetType, targetId, rating, title, body } = payload;
      const { data, error } = await supabase
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
      if (error) throw error;
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
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .in("status", ["pending", "rejected"]);
      if (error) throw error;
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

  const canSubmit = useMemo(() => {
    if (!userId) return false;
    // If there's an approved review, don't allow resubmission
    if (ownReview?.status === "approved") return false;
    // If pending or rejected, allow update (RLS allows)
    return true;
  }, [userId, ownReview]);

  return { canSubmit, userId, ownReview };
}
