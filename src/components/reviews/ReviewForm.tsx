
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RatingStars from "./RatingStars";
import DetailedRatingInput from "./DetailedRatingInput";
import ReviewTemplateSelector from "./ReviewTemplateSelector";
import { useCanSubmitReview, useDeleteOwnDraftReview, useOwnReview, useSubmitReview, useReviewImages, useAddReviewImage, useRemoveReviewImage, type ReviewTemplate } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import MediaUploader from "@/components/media/MediaUploader";

type Props = {
  targetType: "product" | "service";
  targetId: string;
  className?: string;
};

export default function ReviewForm({ targetType, targetId, className }: Props) {
  const { toast } = useToast();
  const { data: ownReview } = useOwnReview(targetType, targetId);
  const { canSubmit, userId, ownReview: ownReviewData, eligible } = useCanSubmitReview(targetType, targetId) as any;
  const submit = useSubmitReview();
  const removeDraft = useDeleteOwnDraftReview(targetType, targetId);

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [qualityRating, setQualityRating] = useState<number>(0);
  const [serviceRating, setServiceRating] = useState<number>(0);
  const [deliveryRating, setDeliveryRating] = useState<number>(0);
  const [valueRating, setValueRating] = useState<number>(0);

  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setTitle(ownReview.title ?? "");
      setBody(ownReview.body ?? "");
      setQualityRating(ownReview.quality_rating ?? 0);
      setServiceRating(ownReview.service_rating ?? 0);
      setDeliveryRating(ownReview.delivery_rating ?? 0);
      setValueRating(ownReview.value_rating ?? 0);
    }
  }, [ownReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTemplateSelect = (template: ReviewTemplate) => {
    setBody(template.template_text);
    setTitle(template.title);
    
    // Apply suggested ratings if available
    if (template.rating_suggestions) {
      if (template.rating_suggestions.quality_rating) setQualityRating(template.rating_suggestions.quality_rating);
      if (template.rating_suggestions.service_rating) setServiceRating(template.rating_suggestions.service_rating);
      if (template.rating_suggestions.delivery_rating) setDeliveryRating(template.rating_suggestions.delivery_rating);
      if (template.rating_suggestions.value_rating) setValueRating(template.rating_suggestions.value_rating);
    }
  };

  // Review images management (only once we have a review id)
  const { data: reviewImages = [] } = useReviewImages(ownReview?.id);
  const addImage = useAddReviewImage(ownReview?.id);
  const removeImage = useRemoveReviewImage(ownReview?.id);
  const currentUrls = reviewImages.map((i: any) => i.url);

  const onImagesChange = (urls: string[]) => {
    const toAdd = urls.filter((u) => !currentUrls.includes(u));
    const toRemove = currentUrls.filter((u) => !urls.includes(u));
    toAdd.forEach((url) => addImage.mutate({ url } as any));
    toRemove.forEach((url) => {
      const img = (reviewImages as any[]).find((i) => i.url === url);
      if (img) removeImage.mutate({ id: img.id } as any);
    });
  };

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
      { 
        targetType, 
        targetId, 
        rating, 
        title, 
        body,
        quality_rating: qualityRating || undefined,
        service_rating: serviceRating || undefined,
        delivery_rating: deliveryRating || undefined,
        value_rating: valueRating || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Review submitted", description: "Your review will be visible after approval." });
        },
        onError: (err: any) => {
          const msg = String(err?.message || "Please try again.");
          const friendly = msg.includes("row-level security") || msg.includes("violates")
            ? "You can only review items you've purchased or completed."
            : msg;
          toast({ title: "Unable to submit review", description: friendly });
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
    <div className={cn("space-y-6", className)}>
      {/* Review Templates */}
      <ReviewTemplateSelector 
        targetType={targetType} 
        onSelectTemplate={handleTemplateSelect}
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Mobile-Optimized Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Ratings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="text-sm font-medium text-foreground">
                    Overall Rating <span className="text-destructive">*</span>
                  </label>
                  <RatingStars value={rating} onChange={setRating} size="lg" />
                </div>
                
                {eligible === false && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You can only review items you've purchased or completed.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
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
                    className="w-full min-h-[120px]"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detailed Ratings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rate different aspects of your experience (optional)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailedRatingInput
                  label="Quality"
                  value={qualityRating}
                  onChange={setQualityRating}
                />
                
                {targetType === "service" && (
                  <DetailedRatingInput
                    label="Service"
                    value={serviceRating}
                    onChange={setServiceRating}
                  />
                )}
                
                <DetailedRatingInput
                  label="Delivery"
                  value={deliveryRating}
                  onChange={setDeliveryRating}
                />
                
                <DetailedRatingInput
                  label="Value"
                  value={valueRating}
                  onChange={setValueRating}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Optional images uploader */}
        {ownReview?.id && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Photos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Help others by showing your experience
              </p>
            </CardHeader>
            <CardContent>
              <MediaUploader
                bucket="review-images"
                folder={`${userId}/${ownReview.id}`}
                max={4}
                value={currentUrls}
                onChange={onImagesChange}
              />
            </CardContent>
          </Card>
        )}

        {!ownReview?.id && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                💡 Tip: Save your rating to add photos to your review
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button 
            type="submit" 
            className="flex-1 sm:flex-none h-11" 
            disabled={!canSubmit || submit.isPending}
          >
            {ownReview ? "Update Review" : "Submit Review"}
          </Button>
          {ownReview && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onDelete} 
              disabled={removeDraft.isPending}
              className="h-11"
            >
              Delete Draft
            </Button>
          )}
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              📋 <strong>Note:</strong> Reviews require approval before they appear publicly. 
              This helps maintain quality and authenticity.
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
