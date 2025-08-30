import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Package, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceRecommendation {
  id: string;
  name: string;
  subtitle: string | null;
  price_cents: number;
  currency: string;
  image_urls: string[] | null;
  vendor: {
    display_name: string;
    id: string;
  };
  rating_summary?: {
    avg_rating: number;
    review_count: number;
  };
  similarity_score?: number;
  recommendation_reason: string;
}

interface ServiceRecommendationsProps {
  userId?: string;
  currentServiceId?: string;
  communityId?: string;
  limit?: number;
}

export const ServiceRecommendations = ({ 
  userId, 
  currentServiceId, 
  communityId, 
  limit = 4 
}: ServiceRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId, currentServiceId, communityId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      if (userId) {
        // Get personalized recommendations based on user history
        await loadPersonalizedRecommendations();
      } else {
        // Get general popular recommendations
        await loadPopularRecommendations();
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalizedRecommendations = async () => {
    if (!userId) return;

    // Get user's booking history (simplified query)
    const { data: userBookings } = await supabase
      .from("service_bookings")
      .select("service_id")
      .eq("buyer_user_id", userId)
      .eq("status", "completed");

    // Get service details and categories for user's booked services
    const serviceIds = userBookings?.map(b => b.service_id) || [];
    const { data: userServiceDetails } = await supabase
      .from("vendor_services")
      .select(`
        id,
        vendor_id,
        service_categories(category_id)
      `)
      .in("id", serviceIds);

    // Extract categories and vendors user has used
    const userCategories = new Set();
    const userVendors = new Set();
    
    userServiceDetails?.forEach(service => {
      userVendors.add(service.vendor_id);
      service.service_categories?.forEach((cat: any) => {
        userCategories.add(cat.category_id);
      });
    });

    // Find similar services
    let query = supabase
      .from("vendor_services")
      .select(`
        id,
        name,
        subtitle,
        price_cents,
        currency,
        image_urls,
        vendor_id,
        vendors!inner(id, display_name, community_id),
        service_categories!inner(category_id)
      `)
      .eq("status", "active");

    if (currentServiceId) {
      query = query.neq("id", currentServiceId);
    }

    if (communityId) {
      query = query.eq("vendors.community_id", communityId);
    }

    const { data: services } = await query.limit(20);

    // Score services based on user preferences
    const scoredServices = services?.map(service => {
      let score = 0;
      let reason = "Recommended for you";

      // Check if service is from a vendor user has used before
      if (userVendors.has(service.vendor_id)) {
        score += 10;
        reason = "From a vendor you've used before";
      }

      // Check category overlap
      const serviceCategoryIds = service.service_categories?.map((sc: any) => sc.category_id) || [];
      const categoryOverlap = serviceCategoryIds.filter(catId => userCategories.has(catId)).length;
      
      if (categoryOverlap > 0) {
        score += categoryOverlap * 5;
        if (reason === "Recommended for you") {
          reason = "Similar to services you've booked";
        }
      }

      // Add some randomness to avoid always showing the same services
      score += Math.random() * 2;

      return {
        ...service,
        vendor: service.vendors,
        similarity_score: score,
        recommendation_reason: reason
      };
    }) || [];

    // Sort by score and take top recommendations
    const topRecommendations = scoredServices
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    // Get ratings for recommendations
    await enhanceWithRatings(topRecommendations);
  };

  const loadPopularRecommendations = async () => {
    // Get services with most bookings and good ratings
    let query = supabase
      .from("vendor_services")
      .select(`
        id,
        name,
        subtitle,
        price_cents,
        currency,
        image_urls,
        vendor_id,
        vendors!inner(id, display_name, community_id)
      `)
      .eq("status", "active");

    if (currentServiceId) {
      query = query.neq("id", currentServiceId);
    }

    if (communityId) {
      query = query.eq("vendors.community_id", communityId);
    }

    const { data: services } = await query
      .order("created_at", { ascending: false })
      .limit(20);

    if (!services?.length) return;

    // Get booking counts for these services
    const serviceIds = services.map(s => s.id);
    const { data: bookingCounts } = await supabase
      .from("service_bookings")
      .select("service_id")
      .in("service_id", serviceIds)
      .eq("status", "completed");

    // Count bookings per service
    const bookingCountMap = new Map();
    bookingCounts?.forEach(booking => {
      const count = bookingCountMap.get(booking.service_id) || 0;
      bookingCountMap.set(booking.service_id, count + 1);
    });

    // Score and sort services
    const scoredServices = services.map(service => {
      const bookingCount = bookingCountMap.get(service.id) || 0;
      const score = bookingCount + Math.random(); // Add randomness
      
      let reason = "Popular in your community";
      if (bookingCount >= 5) {
        reason = "Highly booked service";
      } else if (bookingCount >= 2) {
        reason = "Growing in popularity";
      }

      return {
        ...service,
        vendor: service.vendors,
        similarity_score: score,
        recommendation_reason: reason
      };
    });

    const topRecommendations = scoredServices
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    await enhanceWithRatings(topRecommendations);
  };

  const enhanceWithRatings = async (services: any[]) => {
    const serviceIds = services.map(s => s.id);
    
    const { data: ratings } = await supabase
      .from("service_rating_summary")
      .select("service_id, avg_rating, review_count")
      .in("service_id", serviceIds);

    const ratingsMap = new Map();
    ratings?.forEach(rating => {
      ratingsMap.set(rating.service_id, {
        avg_rating: rating.avg_rating,
        review_count: rating.review_count
      });
    });

    const enhancedServices = services.map(service => ({
      ...service,
      rating_summary: ratingsMap.get(service.id)
    }));

    setRecommendations(enhancedServices);
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recommended Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {userId ? "Recommended for You" : "Popular Services"}
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/products?type=services">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((service) => (
            <Link
              key={service.id}
              to={`/service/${service.id}`}
              className="group block border rounded-lg p-3 hover:shadow-md transition-all duration-200"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  {service.image_urls?.[0] ? (
                    <img
                      src={service.image_urls[0]}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.recommendation_reason.includes("vendor") ? "Trusted" : "Popular"}
                    </Badge>
                  </div>
                  
                  {service.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                      {service.subtitle}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {formatPrice(service.price_cents, service.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {service.vendor.display_name}
                      </p>
                    </div>
                    
                    {service.rating_summary && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                          {service.rating_summary.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({service.rating_summary.review_count})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {service.recommendation_reason}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};