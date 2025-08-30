import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageSquare, Send, User, Star as StarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RatingStars from "./RatingStars";
import ReviewerProfile from "./ReviewerProfile";
import DetailedRatingInput from "./DetailedRatingInput";
import MediaGallery from "@/components/common/MediaGallery";
import { useReviewImages, useReviewResponses, useSubmitReviewResponse, useReviewVote, useVoteOnReview, useRemoveReviewVote } from "@/hooks/useReviews";
import useIsVendor from "@/hooks/useIsVendor";
import type { ReviewRecord } from "@/hooks/useReviews";

type Props = {
  review: ReviewRecord;
  targetType: "product" | "service";
  targetId: string;
};

export default function ReviewCard({ review, targetType, targetId }: Props) {
  const { toast } = useToast();
  const [responseText, setResponseText] = useState("");
  const [showResponseForm, setShowResponseForm] = useState(false);

  const { data: images = [] } = useReviewImages(review.id);
  const { data: responses = [] } = useReviewResponses(review.id);
  const { data: userVote } = useReviewVote(review.id);
  const isVendor = useIsVendor();

  const submitResponse = useSubmitReviewResponse();
  const voteOnReview = useVoteOnReview();
  const removeVote = useRemoveReviewVote();

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting.",
      });
      return;
    }

    try {
      await submitResponse.mutateAsync({
        reviewId: review.id,
        responseText: responseText.trim(),
      });
      
      setResponseText("");
      setShowResponseForm(false);
      toast({
        title: "Response submitted",
        description: "Your response has been posted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit response",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    try {
      if (userVote?.vote_type === voteType) {
        await removeVote.mutateAsync({ reviewId: review.id });
      } else {
        await voteOnReview.mutateAsync({ reviewId: review.id, voteType });
      }
    } catch (error: any) {
      toast({
        title: "Failed to vote",
        description: error.message || "Please sign in to vote on reviews.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* Review Header with Reviewer Profile */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <ReviewerProfile userId={review.user_id} showStats={true} size="md" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(review.created_at)}</span>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="flex items-center gap-3">
        <RatingStars value={review.rating} readOnly size="md" />
        <span className="text-sm font-medium">{review.rating}/5</span>
      </div>

      {/* Detailed Ratings */}
      {(review.quality_rating || review.service_rating || review.delivery_rating || review.value_rating) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-medium text-muted-foreground mb-2 sm:col-span-2">
            Detailed Ratings:
          </div>
          {review.quality_rating && (
            <DetailedRatingInput
              label="Quality"
              value={review.quality_rating}
              readOnly
              size="sm"
            />
          )}
          {review.service_rating && (
            <DetailedRatingInput
              label="Service"
              value={review.service_rating}
              readOnly
              size="sm"
            />
          )}
          {review.delivery_rating && (
            <DetailedRatingInput
              label="Delivery"
              value={review.delivery_rating}
              readOnly
              size="sm"
            />
          )}
          {review.value_rating && (
            <DetailedRatingInput
              label="Value"
              value={review.value_rating}
              readOnly
              size="sm"
            />
          )}
        </div>
      )}

      {/* Review Content */}
      <div className="space-y-3 mb-4">
        {review.title && (
          <h4 className="font-semibold text-foreground">{review.title}</h4>
        )}
        {review.body && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {review.body}
          </p>
        )}

        {/* Review Images */}
        {images.length > 0 && (
          <div className="mt-3">
            <MediaGallery
              images={images.map(img => img.url)}
              videos={[]}
              alt="Review images"
              aspect="square"
              className="rounded-lg overflow-hidden"
            />
          </div>
        )}
      </div>

      {/* Helpfulness Voting */}
      <div className="flex items-center gap-4 mb-4 pt-3 border-t">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        
        <div className="flex items-center gap-2">
          <Button
            variant={userVote?.vote_type === 'helpful' ? "default" : "outline"}
            size="sm"
            onClick={() => handleVote('helpful')}
            className="h-8 px-3"
            disabled={voteOnReview.isPending || removeVote.isPending}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            <span className="text-xs">
              {review.helpful_count || 0}
            </span>
          </Button>
          
          <Button
            variant={userVote?.vote_type === 'not_helpful' ? "default" : "outline"}
            size="sm"
            onClick={() => handleVote('not_helpful')}
            className="h-8 px-3"
            disabled={voteOnReview.isPending || removeVote.isPending}
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Vendor Responses */}
      {responses.length > 0 && (
        <div className="space-y-3 pt-3 border-t">
          {responses.map((response) => (
            <div key={response.id} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Vendor Response
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(response.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {response.response_text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Response Form */}
      {isVendor && responses.length === 0 && (
        <div className="pt-3 border-t">
          {!showResponseForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(true)}
              className="h-8"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Respond to Review
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write a helpful response to this review..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitResponse}
                  size="sm"
                  disabled={submitResponse.isPending || !responseText.trim()}
                  className="h-8"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Post Response
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText("");
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}