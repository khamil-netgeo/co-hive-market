
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RatingStars from "./RatingStars";
import { useCanSubmitReview, useDeleteOwnDraftReview, useOwnReview, useSubmitReview } from "@/hooks/useReviews";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  targetType: "product" | "service";
  targetId: string;
  className?: string;
};

export default function ReviewForm({ targetType, targetId, className }: Props) {
  const { toast } = useToast();
  const { data: ownReview } = useOwnReview(targetType, targetId);
  const { canSubmit, userId } = useCanSubmitReview(targetType, targetId);
  const submit = useSubmitReview();
  const removeDraft = useDeleteOwnDraftReview(targetType, targetId);

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");

  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setTitle(ownReview.title ?? "");
      setBody(ownReview.body ?? "");
    }
  }, [ownReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId) {
    return (
      <div className={cn("p-4 border rounded-lg bg-card", className)}>
        <p className="text-sm text-muted-foreground">
          Please sign in to write a review.
        </p>
        <div className="mt-3">
          <Button asChild className="w-full sm:w-auto">
            <a href="/auth">Sign in</a>
          </Button>
        </div>
      </div>
    );
  }

  if (ownReview?.status === "approved") {
    return (
      <div className={cn("p-4 border rounded-lg bg-card", className)}>
        <p className="text-sm">
          You already reviewed this {targetType}. Thank you!
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          If you need changes, contact support.
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast({ title: "Select a rating", description: "Please choose between 1 and 5 stars." });
      return;
    }
    submit.mutate(
      { targetType, targetId, rating, title, body },
      {
        onSuccess: () => {
          toast({ title: "Review submitted", description: "Your review will be visible after approval." });
        },
        onError: (err: any) => {
          toast({ title: "Unable to submit review", description: err?.message ?? "Please try again." });
        },
      } as any
    );
  };

  const onDelete = async () => {
    removeDraft.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Draft deleted", description: "Your review draft was removed." });
      },
      onError: (err: any) => {
        toast({ title: "Unable to delete", description: err?.message ?? "Please try again." });
      },
    } as any);
  };

  return (
    <form onSubmit={onSubmit} className={cn("p-4 border rounded-lg bg-card", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-sm text-muted-foreground">Your rating</label>
        <RatingStars value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mt-3 grid gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Review title (optional)"
          className="w-full"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Share details about your experience with this ${targetType} (optional)`}
          className="w-full"
          rows={5}
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button type="submit" className="flex-1 sm:flex-none" disabled={!canSubmit || submit.isPending}>
          {ownReview ? "Update review" : "Submit review"}
        </Button>
        {ownReview && (
          <Button type="button" variant="outline" onClick={onDelete} disabled={removeDraft.isPending}>
            Delete draft
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Note: Reviews require approval before they appear publicly.
      </p>
    </form>
  );
}
