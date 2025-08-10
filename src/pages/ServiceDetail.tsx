import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import ServiceImage from "@/components/service/ServiceImage";
import { Briefcase, MapPin, Clock, Calendar, Star, ArrowLeft } from "lucide-react";
import BookingDatePicker from "@/components/service/BookingDatePicker";
import ServiceDetailsCard from "@/components/service/ServiceDetailsCard";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";

interface Service {
  id: string;
  vendor_id: string;
  name: string;
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  duration_minutes?: number | null;
  service_area?: string | null;
  location_type?: string | null;
  availability_preset?: string | null;
  image_urls?: string[] | null;
}

interface Vendor { 
  id: string; 
  member_discount_override_percent: number | null;
  community_id?: string;
}

interface Community { 
  id: string; 
  name: string; 
  member_discount_percent: number;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Booking state
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) {
      navigate('/catalog');
      return;
    }
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      setLoading(true);
      
      // Load service
      const { data: serviceData, error: serviceError } = await supabase
        .from("vendor_services")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (serviceError) throw serviceError;
      if (!serviceData) {
        toast.error("Service not found");
        navigate('/catalog');
        return;
      }

      setService(serviceData);
      setSEO(`${serviceData.name} | CoopMarket`, serviceData.description || `Book ${serviceData.name} service.`);

      // Load vendor info and community
      if (serviceData.vendor_id) {
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("id, member_discount_override_percent, community_id")
          .eq("id", serviceData.vendor_id)
          .single();
        
        if (vendorData) {
          setVendor(vendorData);

          // Load community info if vendor has one
          if (vendorData.community_id) {
            const [communityRes, memberRes] = await Promise.all([
              supabase
                .from("communities")
                .select("id, name, member_discount_percent")
                .eq("id", vendorData.community_id)
                .single(),
              supabase.auth.getSession().then(({ data: sessionData }) => 
                sessionData.session 
                  ? supabase
                      .from("community_members")
                      .select("community_id")
                      .eq("community_id", vendorData.community_id!)
                      .eq("user_id", sessionData.session.user.id)
                      .single()
                  : Promise.resolve({ data: null, error: null })
              )
            ]);

            if (communityRes.data) setCommunity(communityRes.data);
            setIsMember(!!memberRes.data);
          }
        }
      }

    } catch (error: any) {
      toast.error("Failed to load service", { description: error.message });
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const fmtPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    const code = currency?.toUpperCase?.() || "USD";
    return new Intl.NumberFormat(code === "MYR" ? "ms-MY" : "en-US", { 
      style: "currency", 
      currency: code 
    }).format(amount);
  };

  const getDiscountPercent = () => {
    if (!vendor?.community_id || !community) return 0;
    if (vendor?.member_discount_override_percent != null) {
      return vendor.member_discount_override_percent;
    }
    return community.member_discount_percent || 0;
  };

  const getMemberPrice = () => {
    if (!service || !isMember) return null;
    const discountPercent = getDiscountPercent();
    if (discountPercent <= 0) return null;
    return Math.round(service.price_cents * (1 - discountPercent / 100));
  };

  const bookService = async () => {
    if (!service) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to book services." });
        navigate("/auth");
        return;
      }

      const buyerId = sessionData.session.user.id;
      const when = scheduledDateTime ? new Date(scheduledDateTime).toISOString() : null;
      
      // Create a booking row first
      const { data: bookingRows, error: bookingErr } = await supabase
        .from("service_bookings")
        .insert({
          service_id: service.id,
          buyer_user_id: buyerId,
          scheduled_at: when,
          total_amount_cents: service.price_cents,
          currency: service.currency,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (bookingErr) throw bookingErr;
      const bookingId = (bookingRows as any)?.id;

      // Start Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Service: ${service.name}`,
          amount_cents: service.price_cents,
          currency: service.currency || "myr",
          success_path: `/payment-success?booking_id=${bookingId}`,
          cancel_path: "/payment-canceled",
          vendor_id: service.vendor_id,
          community_id: vendor?.community_id,
        },
      });

      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("No checkout URL returned");
      
      window.open(url, "_blank");
    } catch (e: any) {
      toast("Unable to book", { description: e.message || String(e) });
    }
  };

  const joinCommunity = async () => {
    if (!vendor?.community_id) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to join communities and unlock discounts." });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("community_members")
        .upsert(
          { 
            community_id: vendor.community_id, 
            user_id: sessionData.session.user.id, 
            member_type: "buyer" 
          },
          { onConflict: "community_id,user_id,member_type" }
        );

      if (error) throw error;
      
      setIsMember(true);
      toast("Joined community", { description: "Member discount is now applied." });
    } catch (e: any) {
      toast("Unable to join", { description: e.message || String(e) });
    }
  };

  if (loading) {
    return (
      <main className="container px-4 py-6 md:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="container px-4 py-6 md:py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Service not found</h1>
          <Button asChild>
            <Link to="/catalog">Back to catalog</Link>
          </Button>
        </div>
      </main>
    );
  }

  const discountPercent = getDiscountPercent();
  const memberPrice = getMemberPrice();
  const scheduledDate = scheduledDateTime ? new Date(scheduledDateTime) : undefined;

  return (
    <main className="container px-4 py-6 pb-24 md:py-12">
      <div className="space-y-6">
        {/* Navigation */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/catalog" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <ServiceImage 
                imageUrls={service.image_urls}
                serviceName={service.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Additional Images */}
            {service.image_urls && service.image_urls.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {service.image_urls.slice(1, 4).map((url, idx) => (
                  <div key={idx} className="aspect-square overflow-hidden rounded border">
                    <img 
                      src={url} 
                      alt={`${service.name} image ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold mb-2">
                <Briefcase className="h-6 w-6 text-primary" />
                {service.name}
                {memberPrice && discountPercent > 0 && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    Members save {discountPercent}%
                  </span>
                )}
              </h1>
              {service.subtitle && (
                <p className="text-lg text-muted-foreground">{service.subtitle}</p>
              )}
            </div>

            {service.description && (
              <div>
                <h3 className="font-semibold mb-2">Service Overview</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
              </div>
            )}

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {memberPrice ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-primary">{fmtPrice(memberPrice, service.currency)}</span>
                      <span className="text-lg text-muted-foreground line-through">
                        {fmtPrice(service.price_cents, service.currency)}
                      </span>
                    </div>
                  ) : (
                    <span>{fmtPrice(service.price_cents, service.currency)}</span>
                  )}
                </div>

                {/* Community join CTA */}
                {!memberPrice && discountPercent > 0 && community && (
                  <div className="rounded-lg border bg-card p-4 mb-4">
                    <div className="text-sm mb-3">
                      <Star className="h-4 w-4 inline mr-1 text-primary" />
                      Join {community.name} to save {discountPercent}% and pay {fmtPrice(Math.round(service.price_cents * (1 - discountPercent / 100)), service.currency)}.
                    </div>
                    <Button size="sm" variant="secondary" onClick={joinCommunity}>
                      Join community to save
                    </Button>
                  </div>
                )}

                {/* Quick Booking */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="datetime" className="text-sm font-medium">
                      Preferred date & time (optional)
                    </Label>
                    <div className="mt-1">
                      <BookingDatePicker
                        value={scheduledDate}
                        onChange={(d) => setScheduledDateTime(d ? d.toISOString() : "")}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add special instructions or requirements..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    variant="hero" 
                    onClick={bookService}
                    className="w-full flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Book & Pay {fmtPrice(memberPrice || service.price_cents, service.currency)}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Service Information */}
            <ServiceDetailsCard
              service={service}
              vendor={vendor ? { 
                id: vendor.id, 
                name: 'Service Provider'
              } : undefined}
              onBookNow={bookService}
              onContactVendor={() => toast.info('Contact feature coming soon')}
            />
          </div>
        </div>

        <section id="reviews" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <ReviewSummary targetType="service" targetId={service.id} />
              </div>
              <ReviewList targetType="service" targetId={service.id} />
              <ReviewForm targetType="service" targetId={service.id} />
            </CardContent>
          </Card>
        </section>

        {/* Sticky mobile CTA */}
        <div className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-base font-semibold">
              {fmtPrice(memberPrice || service.price_cents, service.currency)}
            </div>
            <Button variant="hero" className="min-w-[140px]" onClick={bookService}>
              Book & Pay
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}