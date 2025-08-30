import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Star, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ReviewAutomationProps {
  onReviewRequested?: () => void;
}

export const ReviewAutomation = ({ onReviewRequested }: ReviewAutomationProps) => {
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompletedBookings();
  }, []);

  const loadCompletedBookings = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      // Get completed bookings that don't have reviews yet
      const { data: bookings, error } = await supabase
        .from("service_bookings")
        .select(`
          id,
          service_id,
          scheduled_at,
          total_amount_cents,
          currency,
          vendor_services!inner(id, name, vendor_id),
          vendors!inner(id, display_name)
        `)
        .eq("buyer_user_id", session.session.user.id)
        .eq("status", "completed")
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      // Check which bookings already have reviews
      const bookingServiceIds = bookings?.map(b => b.service_id) || [];
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("target_id")
        .eq("user_id", session.session.user.id)
        .eq("target_type", "service")
        .in("target_id", bookingServiceIds);

      const reviewedServiceIds = new Set(existingReviews?.map(r => r.target_id) || []);
      const pendingReviewBookings = bookings?.filter(b => !reviewedServiceIds.has(b.service_id)) || [];

      setCompletedBookings(bookings || []);
      setPendingReviews(pendingReviewBookings);
    } catch (error) {
      console.error("Error loading completed bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestReview = async (booking: any) => {
    try {
      // For demo purposes, just show a toast since notifications table doesn't exist
      toast.success("Review request would be sent!");
      onReviewRequested?.();
    } catch (error) {
      console.error("Error requesting review:", error);
      toast.error("Failed to send review request");
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-48"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reviews Alert */}
      {pendingReviews.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Clock className="h-5 w-5" />
              Pending Reviews ({pendingReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 dark:text-orange-300 mb-4">
              You have {pendingReviews.length} completed service{pendingReviews.length > 1 ? 's' : ''} waiting for your review. 
              Your feedback helps other community members make informed decisions.
            </p>
            <div className="space-y-3">
              {pendingReviews.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{booking.vendor_services.name}</p>
                    <p className="text-sm text-muted-foreground">
                      by {booking.vendors.display_name} • {formatPrice(booking.total_amount_cents, booking.currency)}
                    </p>
                    {booking.scheduled_at && (
                      <p className="text-xs text-muted-foreground">
                        Completed {new Date(booking.scheduled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => navigate(`/service/${booking.service_id}?review=true`)}
                  >
                    Write Review
                  </Button>
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/orders')}>
                  View All Completed Services
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Incentives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Review Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">Help Others</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Your reviews guide community members to quality services
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">Build Trust</h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                Detailed reviews create transparency and accountability
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-purple-700 dark:text-purple-400">Improve Quality</h3>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Feedback helps service providers enhance their offerings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completed Services */}
      {completedBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Completed Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedBookings.slice(0, 5).map((booking) => {
                const hasReview = !pendingReviews.find(p => p.id === booking.id);
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.vendor_services.name}</p>
                      <p className="text-sm text-muted-foreground">
                        by {booking.vendors.display_name}
                      </p>
                      {booking.scheduled_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.scheduled_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasReview ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Reviewed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/service/${booking.service_id}`)}
                      >
                        View Service
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};