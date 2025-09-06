import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
  product_id?: string;
  service_id?: string;
  vendor_response?: string;
  response_date?: string;
  profiles?: {
    display_name: string;
  };
  products?: {
    name: string;
  };
  services?: {
    name: string;
  };
}

export default function VendorReviews() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUserId(session.user.id);
      
      // Get vendor IDs for the user
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session.user.id);
      
      if (vendors) {
        setVendorIds(vendors.map(v => v.id));
      }
    };
    
    getUser();
  }, [navigate]);

  const { data: reviews, refetch } = useQuery({
    queryKey: ['vendor-reviews', vendorIds],
    queryFn: async () => {
      if (vendorIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          body,
          created_at,
          user_id,
          product_id,
          service_id,
          vendor_response,
          response_date,
          profiles!reviews_user_id_fkey(display_name),
          products(name, vendor_id),
          services(name, vendor_id)
        `)
        .or(`products.vendor_id.in.(${vendorIds.join(',')}),services.vendor_id.in.(${vendorIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: vendorIds.length > 0,
    refetchOnWindowFocus: false,
  });

  const handleResponseSubmit = async (reviewId: string) => {
    const response = responses[reviewId];
    if (!response?.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          vendor_response: response.trim(),
          response_date: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success("Response posted successfully!");
      setResponses(prev => ({ ...prev, [reviewId]: '' }));
      refetch();
    } catch (error) {
      console.error('Error posting response:', error);
      toast.error("Failed to post response. Please try again.");
    }
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getResponseRate = () => {
    if (!reviews || reviews.length === 0) return 0;
    const responded = reviews.filter(r => r.vendor_response).length;
    return Math.round((responded / reviews.length) * 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vendor/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Customer Reviews</h1>
          <p className="text-muted-foreground">Manage and respond to customer feedback</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {getAverageRating()}
              <RatingStars rating={parseFloat(getAverageRating())} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {reviews?.length || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all products & services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResponseRate()}%</div>
            <p className="text-xs text-muted-foreground">
              Reviews with responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews?.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <RatingStars rating={review.rating} size="sm" />
                    <Badge variant="outline">
                      {review.products?.name || review.services?.name}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{review.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    By {review.profiles?.display_name || 'Anonymous'} • {' '}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{review.body}</p>
              
              {review.vendor_response ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Your Response</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.response_date!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{review.vendor_response}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Respond to this review
                    </label>
                    <Textarea
                      placeholder="Write a professional response to this customer..."
                      value={responses[review.id] || ''}
                      onChange={(e) => setResponses(prev => ({
                        ...prev,
                        [review.id]: e.target.value
                      }))}
                      className="mb-3"
                    />
                    <Button
                      onClick={() => handleResponseSubmit(review.id)}
                      size="sm"
                    >
                      Post Response
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {reviews?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                Customer reviews will appear here once you start receiving them.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}