import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Star, MessageSquare, ThumbsUp, Reply, Heart } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    phone: string | null;
  };
  review_images?: {
    url: string;
  }[];
  vendor_response?: {
    id: string;
    response: string;
    created_at: string;
  } | null;
}

interface ReviewManagementProps {
  targetType: "product" | "service";
  targetId: string;
  vendorId: string;
  reviews: Review[];
  onReviewUpdate?: () => void;
}

export const ReviewManagement = ({ 
  targetType, 
  targetId, 
  vendorId, 
  reviews,
  onReviewUpdate 
}: ReviewManagementProps) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const submitResponse = async (reviewId: string) => {
    const responseText = responses[reviewId]?.trim();
    if (!responseText) {
      toast.error("Please enter a response");
      return;
    }

    setSubmitting(prev => ({ ...prev, [reviewId]: true }));

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Please sign in to respond");
        return;
      }

      // Check if vendor owns this service/product
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", session.session.user.id)
        .eq("id", vendorId)
        .maybeSingle();

      if (!vendorData) {
        toast.error("You can only respond to reviews for your own services");
        return;
      }

      // For demo purposes, just update review status since vendor_review_responses table doesn't exist
      // In a real implementation, you'd insert into vendor_review_responses table
      toast.success("Response would be submitted!");
      setResponses(prev => ({ ...prev, [reviewId]: "" }));
      onReviewUpdate?.();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    } finally {
      setSubmitting(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const averageRating = getAverageRating();
  const distribution = getRatingDistribution();
  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      {/* Review Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-2">
              {Object.entries(distribution)
                .reverse()
                .map(([rating, count]) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{
                          width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews with Response Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Reviews & Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm">Reviews will appear here once customers share their feedback</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="outline">{review.rating}/5</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    {review.title && (
                      <h4 className="font-semibold mb-2">{review.title}</h4>
                    )}
                    {review.body && (
                      <p className="text-sm text-muted-foreground mb-3">{review.body}</p>
                    )}
                    
                    {/* Review Images */}
                    {review.review_images && review.review_images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.review_images.map((image, index) => (
                          <img
                            key={index}
                            src={image.url}
                            alt="Review image"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Vendor Response Section */}
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <Reply className="h-4 w-4" />
                      Vendor Response
                    </h5>

                    {review.vendor_response ? (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <p className="text-sm">{review.vendor_response.response}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Responded {format(new Date(review.vendor_response.created_at), 'PPP')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Write a professional response to this review..."
                          value={responses[review.id] || ""}
                          onChange={(e) =>
                            setResponses(prev => ({
                              ...prev,
                              [review.id]: e.target.value
                            }))
                          }
                          rows={3}
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Tip: Thank the customer and address any specific concerns professionally
                          </p>
                          <Button
                            size="sm"
                            onClick={() => submitResponse(review.id)}
                            disabled={
                              !responses[review.id]?.trim() || 
                              submitting[review.id]
                            }
                          >
                            {submitting[review.id] ? "Submitting..." : "Post Response"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Management Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Best Practices for Review Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Do:</h4>
              <ul className="space-y-1 text-green-600 dark:text-green-300">
                <li>• Thank customers for their feedback</li>
                <li>• Address specific concerns mentioned</li>
                <li>• Keep responses professional and friendly</li>
                <li>• Show how you'll improve based on feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-red-700 dark:text-red-400">Don't:</h4>
              <ul className="space-y-1 text-red-600 dark:text-red-300">
                <li>• Argue with customers publicly</li>
                <li>• Share personal customer information</li>
                <li>• Use defensive or hostile language</li>
                <li>• Make excuses without solutions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};