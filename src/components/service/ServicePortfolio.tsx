import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturedService {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
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
  booking_count?: number;
}

interface ServicePortfolioProps {
  communityId?: string;
  limit?: number;
}

export const ServicePortfolio = ({ communityId, limit = 6 }: ServicePortfolioProps) => {
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [popularServices, setPopularServices] = useState<FeaturedService[]>([]);
  const [topRatedServices, setTopRatedServices] = useState<FeaturedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServicePortfolio();
  }, [communityId]);

  const loadServicePortfolio = async () => {
    try {
      setLoading(true);

      // Base query for active services with vendor info
      let baseQuery = supabase
        .from("vendor_services")
        .select(`
          id,
          name,
          subtitle,
          description,
          price_cents,
          currency,
          image_urls,
          vendor_id,
          vendors!inner(id, display_name, community_id)
        `)
        .eq("status", "active");

      // Filter by community if specified
      if (communityId) {
        baseQuery = baseQuery.eq("vendors.community_id", communityId);
      }

      const { data: services, error } = await baseQuery
        .order("created_at", { ascending: false })
        .limit(50); // Get more to work with

      if (error) throw error;

      // Get service ratings
      const serviceIds = services?.map(s => s.id) || [];
      if (serviceIds.length > 0) {
        const [ratingsData, bookingsData] = await Promise.all([
          supabase
            .from("service_rating_summary")
            .select("service_id, avg_rating, review_count")
            .in("service_id", serviceIds),
          supabase
            .from("service_bookings")
            .select("service_id")
            .in("service_id", serviceIds)
            .eq("status", "completed")
        ]);

        // Create rating lookup
        const ratingsLookup = new Map();
        ratingsData.data?.forEach(r => {
          ratingsLookup.set(r.service_id, {
            avg_rating: r.avg_rating,
            review_count: r.review_count
          });
        });

        // Count bookings per service
        const bookingCounts = new Map();
        bookingsData.data?.forEach(b => {
          bookingCounts.set(b.service_id, (bookingCounts.get(b.service_id) || 0) + 1);
        });

        // Enhance services with ratings and booking counts
        const enhancedServices = services?.map(service => ({
          ...service,
          vendor: {
            id: service.vendors[0]?.id || service.vendor_id,
            display_name: service.vendors[0]?.display_name || "Unknown Vendor"
          },
          rating_summary: ratingsLookup.get(service.id),
          booking_count: bookingCounts.get(service.id) || 0
        })) || [];

        // Featured Services (newest with good ratings or high booking count)
        const featured = enhancedServices
          .filter(s => 
            (s.rating_summary?.avg_rating >= 4.0 && s.rating_summary?.review_count >= 2) ||
            s.booking_count >= 5 ||
            s.image_urls?.length > 0
          )
          .slice(0, limit);
        setFeaturedServices(featured);

        // Popular Services (most bookings)
        const popular = enhancedServices
          .filter(s => s.booking_count > 0)
          .sort((a, b) => b.booking_count - a.booking_count)
          .slice(0, limit);
        setPopularServices(popular);

        // Top Rated Services
        const topRated = enhancedServices
          .filter(s => s.rating_summary?.avg_rating >= 4.0 && s.rating_summary?.review_count >= 1)
          .sort((a, b) => {
            const aRating = a.rating_summary?.avg_rating || 0;
            const bRating = b.rating_summary?.avg_rating || 0;
            const aReviews = a.rating_summary?.review_count || 0;
            const bReviews = b.rating_summary?.review_count || 0;
            
            // Prioritize higher rating, then more reviews
            if (Math.abs(aRating - bRating) > 0.1) {
              return bRating - aRating;
            }
            return bReviews - aReviews;
          })
          .slice(0, limit);
        setTopRatedServices(topRated);
      }
    } catch (error) {
      console.error("Error loading service portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const renderServiceCard = (service: FeaturedService, showBadge?: { type: 'featured' | 'popular' | 'top-rated' }) => (
    <Card key={service.id} className="group hover:shadow-lg transition-all duration-300">
      <div className="relative">
        {service.image_urls?.[0] ? (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img 
              src={service.image_urls[0]} 
              alt={service.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Service</p>
            </div>
          </div>
        )}
        
        {showBadge && (
          <Badge 
            className={`absolute top-2 right-2 ${
              showBadge.type === 'featured' ? 'bg-blue-500' : 
              showBadge.type === 'popular' ? 'bg-orange-500' : 
              'bg-purple-500'
            }`}
          >
            {showBadge.type === 'featured' && <Award className="w-3 h-3 mr-1" />}
            {showBadge.type === 'popular' && <TrendingUp className="w-3 h-3 mr-1" />}
            {showBadge.type === 'top-rated' && <Star className="w-3 h-3 mr-1" />}
            {showBadge.type === 'featured' ? 'Featured' : 
             showBadge.type === 'popular' ? 'Popular' : 
             'Top Rated'}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{service.name}</h3>
            {service.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1">{service.subtitle}</p>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description || "Professional service available for booking"}
          </p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary">
                {formatPrice(service.price_cents, service.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                by {service.vendor.display_name}
              </p>
            </div>
            
            <div className="text-right">
              {service.rating_summary && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {service.rating_summary.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({service.rating_summary.review_count})
                  </span>
                </div>
              )}
              {service.booking_count > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {service.booking_count} bookings
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <Button asChild className="w-full mt-3">
            <Link to={`/service/${service.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="h-6 w-6 text-blue-500" />
                Featured Services
              </h2>
              <p className="text-muted-foreground mt-1">
                Highlighted services with excellent quality and customer satisfaction
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/products?type=services">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map(service => 
              renderServiceCard(service, { type: 'featured' })
            )}
          </div>
        </section>
      )}

      {/* Popular Services */}
      {popularServices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-orange-500" />
                Popular Services
              </h2>
              <p className="text-muted-foreground mt-1">
                Most booked services in your community
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularServices.map(service => 
              renderServiceCard(service, { type: 'popular' })
            )}
          </div>
        </section>
      )}

      {/* Top Rated Services */}
      {topRatedServices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-purple-500" />
                Top Rated Services
              </h2>
              <p className="text-muted-foreground mt-1">
                Highest rated services by customer reviews
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRatedServices.map(service => 
              renderServiceCard(service, { type: 'top-rated' })
            )}
          </div>
        </section>
      )}
    </div>
  );
};