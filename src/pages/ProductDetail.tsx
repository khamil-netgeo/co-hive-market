import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isValidUUID } from "@/lib/slugs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEOAdvanced } from "@/lib/seo";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import MediaGallery from "@/components/common/MediaGallery";
import { Package, MapPin, Star, ShoppingCart, MessageSquare } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ShareButtons from "@/components/common/ShareButtons";
import ProductTrustBadges from "@/components/product/ProductTrustBadges";
import ShippingEstimator from "@/components/product/ShippingEstimator";
import DeliveryBanner from "@/components/delivery/DeliveryBanner";
import DeliveryInfoCard from "@/components/delivery/DeliveryInfoCard";
import DeliveryMethodsCard from "@/components/delivery/DeliveryMethodsCard";
import ProductSpecificationsCard from "@/components/product/ProductSpecificationsCard";
import { ReviewSummary, ReviewList, ReviewForm, ReviewRatingDistribution } from "@/components/reviews";
import { Input } from "@/components/ui/input";
import { useVendorFollow } from "@/hooks/useVendorFollow";
import { SectionErrorBoundary } from "@/components/error/SectionErrorBoundary";
import { AsyncErrorBoundary } from "@/components/error/AsyncErrorBoundary";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id?: string;
  image_urls?: string[] | null;
  video_url?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  stock_qty?: number;
  weight_grams?: number | null;
  product_kind?: string;
  perishable?: boolean;
  refrigeration_required?: boolean;
  allow_easyparcel?: boolean;
  allow_rider_delivery?: boolean;
  prep_time_minutes?: number;
  slug?: string;
}

interface Vendor { id: string; member_discount_override_percent: number | null }
interface Community { id: string; name: string; member_discount_percent: number }

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cart = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
const [deliveryOption, setDeliveryOption] = useState<'asap' | 'schedule'>('asap');
const [scheduledAt, setScheduledAt] = useState<string>('');
const [deliveryMethod, setDeliveryMethod] = useState<'rider' | 'easyparcel' | 'pickup'>('rider');
  const { isFollowing, followersCount, toggle, loading: followLoading } = useVendorFollow(product?.vendor_id);

  useEffect(() => {
    if (!id) {
      navigate('/catalog');
      return;
    }
    loadProduct();
    getUserLocation();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      // Determine if the identifier is a UUID (legacy ID) or a slug
      const isUUID = isValidUUID(id || '');
      const queryField = isUUID ? 'id' : 'slug';
      
      // Load product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq(queryField, id)
        .eq("status", "active")
        .single();

      if (productError) throw productError;
      if (!productData) {
        toast.error("Product not found");
        navigate('/catalog');
        return;
      }

      // If accessed via legacy ID, redirect to slug URL
      if (isUUID && productData.slug) {
        navigate(`/product/${productData.slug}`, { replace: true });
        return;
      }

      setProduct(productData);
      setSEOAdvanced({
        title: `${productData.name} | CoopMarket`,
        description: productData.description || `Buy ${productData.name} with member discounts.`,
        type: "product",
        image: productData.image_urls?.[0] || undefined,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: productData.name,
          description: productData.description || undefined,
          image: productData.image_urls || undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: (productData.currency || "MYR").toUpperCase(),
            price: (productData.price_cents / 100).toFixed(2),
            availability: productData.stock_qty && productData.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        },
      });

      // Load vendor info
      if (productData.vendor_id) {
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("id, member_discount_override_percent")
          .eq("id", productData.vendor_id)
          .single();
        
        if (vendorData) setVendor(vendorData);
      }

      // Load community info and membership status
      if (productData.community_id) {
        const [communityRes, memberRes] = await Promise.all([
          supabase
            .from("communities")
            .select("id, name, member_discount_percent")
            .eq("id", productData.community_id)
            .single(),
          supabase.auth.getSession().then(({ data: sessionData }) => 
            sessionData.session 
              ? supabase
                  .from("community_members")
                  .select("community_id")
                  .eq("community_id", productData.community_id!)
                  .eq("user_id", sessionData.session.user.id)
                  .single()
              : Promise.resolve({ data: null, error: null })
          )
        ]);

        if (communityRes.data) setCommunity(communityRes.data);
        setIsMember(!!memberRes.data);
      }

    } catch (error: any) {
      toast.error("Failed to load product", { description: error.message });
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data } = await supabase.from("profiles").select("latitude,longitude").single();
        if (data?.latitude && data?.longitude) {
          setUserLocation({ lat: data.latitude, lng: data.longitude });
          return;
        }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => void 0
        );
      }
    } catch {}
  };

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
    if (!product?.community_id || !community) return 0;
    if (vendor?.member_discount_override_percent != null) {
      return vendor.member_discount_override_percent;
    }
    return community.member_discount_percent || 0;
  };

  const getMemberPrice = () => {
    if (!product || !isMember) return null;
    const discountPercent = getDiscountPercent();
    if (discountPercent <= 0) return null;
    return Math.round(product.price_cents * (1 - discountPercent / 100));
  };

  const addToCart = () => {
    if (!product) return;
    
    const vendorMismatch = cart.vendor_id && cart.vendor_id !== product.vendor_id;
    const currencyMismatch = cart.currency && cart.currency.toUpperCase() !== (product.currency || "usd").toUpperCase();
    
    if (vendorMismatch || currencyMismatch) {
      toast("Single vendor cart", { 
        description: "Please checkout or clear your current cart before adding items from another vendor or currency." 
      });
      return;
    }

    cart.add({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      currency: product.currency,
      vendor_id: product.vendor_id,
      community_id: product.community_id || "",
    }, 1);
    
    toast.success("Added to cart");
  };

  const buyNow = async () => {
    if (!product) return;
    const vendorMismatch = cart.vendor_id && cart.vendor_id !== product.vendor_id;
    const currencyMismatch = cart.currency && cart.currency.toUpperCase() !== (product.currency || "usd").toUpperCase();
    if (vendorMismatch || currencyMismatch) {
      toast("Single vendor cart", { description: "Please checkout or clear your current cart first." });
      return;
    }
    cart.add({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      currency: product.currency,
      vendor_id: product.vendor_id,
      community_id: product.community_id || "",
    }, 1);
    navigate("/checkout");
  };

  const joinCommunity = async () => {
    if (!product?.community_id) return;
    
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
            community_id: product.community_id, 
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

  if (!product) {
    return (
    <main className="container px-4 py-6 pb-24 md:py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <Button asChild>
            <Link to="/catalog">Back to catalog</Link>
          </Button>
        </div>
      </main>
    );
  }

  const discountPercent = getDiscountPercent();
  const memberPrice = getMemberPrice();

  const distanceKm = (product.pickup_lat && product.pickup_lng && userLocation)
    ? haversineKm(userLocation.lat, userLocation.lng, product.pickup_lat, product.pickup_lng)
    : null;
  const basePrep = product.prep_time_minutes ?? 15;
  const rideMins = distanceKm ? Math.max(10, Math.round(distanceKm * 3)) : 30;
  const etaMin = basePrep + rideMins;
  const etaRangeText = `${etaMin}-${etaMin + 15} mins`;


  return (
    <main className="px-2 sm:container sm:px-4 py-3 sm:py-4 pb-20 sm:pb-24 md:pb-12">
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: product.name },
          ]}
          className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm px-1 sm:px-0"
        />

        {/* Mobile-First Hero Section */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Product Header - Mobile Stack, Desktop Side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {/* Product Image Gallery */}
            <div className="order-1 px-1 sm:px-0">
              <MediaGallery
                images={product.image_urls || []}
                videos={product.video_url ? [product.video_url] : []}
                alt={product.name}
                aspect="video"
                className="rounded-lg overflow-hidden shadow-sm"
              />
            </div>

            {/* Product Title & Key Info */}
            <div className="order-2 space-y-3 px-1 sm:px-0">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight break-words">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-1" />
                        <span>{product.name}</span>
                      </div>
                    </h1>
                    {memberPrice && discountPercent > 0 && (
                      <span className="inline-block mt-2 rounded-full bg-primary/10 px-2 sm:px-3 py-1 text-xs sm:text-sm text-primary font-medium">
                        Members save {discountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-start">
                    <ShareButtons title={product.name} url={(typeof window !== 'undefined' ? window.location.origin : '') + `/product/${product.slug || product.id}` } />
                  </div>
                </div>

                {/* Mobile Pricing - Prominent and Easy to Read */}
                <Card className="lg:hidden shadow-sm border-0 bg-background">
                  <CardContent className="p-3">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-3">
                      {memberPrice ? (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                          <span className="text-primary">{fmtPrice(memberPrice, product.currency)}</span>
                          <span className="text-sm sm:text-base text-muted-foreground line-through">
                            {fmtPrice(product.price_cents, product.currency)}
                          </span>
                        </div>
                      ) : (
                        <span>{fmtPrice(product.price_cents, product.currency)}</span>
                      )}
                    </div>

                    {/* Community join CTA */}
                    {!memberPrice && discountPercent > 0 && community && (
                      <div className="rounded-lg border bg-muted/30 p-3 mb-3">
                        <div className="text-xs sm:text-sm mb-2 leading-relaxed">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 text-primary" />
                          Join {community.name} to save {discountPercent}% and pay {fmtPrice(Math.round(product.price_cents * (1 - discountPercent / 100)), product.currency)}.
                        </div>
                        <Button size="sm" variant="secondary" onClick={joinCommunity} className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                          Join community to save
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Desktop Pricing - Hidden on mobile */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                {memberPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-primary">{fmtPrice(memberPrice, product.currency)}</span>
                    <span className="text-lg text-muted-foreground line-through">
                      {fmtPrice(product.price_cents, product.currency)}
                    </span>
                  </div>
                ) : (
                  <span>{fmtPrice(product.price_cents, product.currency)}</span>
                )}
              </div>

              {/* Community join CTA */}
              {!memberPrice && discountPercent > 0 && community && (
                <div className="rounded-lg border bg-card p-4 mb-4">
                  <div className="text-sm mb-3">
                    <Star className="h-4 w-4 inline mr-1 text-primary" />
                    Join {community.name} to save {discountPercent}% and pay {fmtPrice(Math.round(product.price_cents * (1 - discountPercent / 100)), product.currency)}.
                  </div>
                  <Button size="sm" variant="secondary" onClick={joinCommunity}>
                    Join community to save
                  </Button>
                </div>
              )}

              {/* Desktop Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="secondary" 
                  onClick={addToCart} 
                  className="flex items-center gap-2 h-11"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to cart
                </Button>
                <Button 
                  variant="hero" 
                  onClick={buyNow}
                  className="flex items-center gap-2 h-11"
                >
                  Buy now
                </Button>
                {product.vendor_id && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/chat?vendorId=${product.vendor_id}`)}
                    className="flex items-center gap-2 h-11"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message seller
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections - Mobile Stack, Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 px-1 sm:px-0">
          {/* Description, Details & Vendor Info */}
          <Card className="order-1 shadow-sm border-l-0 border-r-0 sm:border-l sm:border-r rounded-none sm:rounded-lg">
            <CardHeader className="pb-2 sm:pb-3 md:pb-6 p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-6 pt-0">
              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="font-medium mb-2 text-xs sm:text-sm md:text-base">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm md:text-base">{product.description}</p>
                </div>
              )}

              {/* Product Details */}
              <div>
                <h4 className="font-medium mb-2 text-xs sm:text-sm md:text-base">Product Details</h4>
                <div className="space-y-2">
                  {product.stock_qty != null && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-muted/20 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span>Stock: {product.stock_qty} available</span>
                    </div>
                  )}
                  {product.pickup_lat && product.pickup_lng && userLocation && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-muted/20 rounded-lg">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span>Distance: {haversineKm(userLocation.lat, userLocation.lng, product.pickup_lat, product.pickup_lng).toFixed(1)} km away</span>
                    </div>
                  )}
                  {product.weight_grams && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-muted/20 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span>Weight: {(product.weight_grams / 1000).toFixed(2)} kg</span>
                    </div>
                  )}
                  {product.product_kind && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-muted/20 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span>Category: {product.product_kind.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Features */}
              <div>
                <h4 className="font-medium mb-2 text-xs sm:text-sm md:text-base">Product Features</h4>
                <div className="space-y-2">
                  {product.perishable && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-orange-700">Perishable item</span>
                    </div>
                  )}
                  {product.refrigeration_required && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-blue-700">Requires refrigeration</span>
                    </div>
                  )}
                  {product.allow_easyparcel && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-green-50 border border-green-200 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-700">Courier delivery available</span>
                    </div>
                  )}
                  {product.allow_rider_delivery && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-purple-700">Rider delivery available</span>
                    </div>
                  )}
                  {product.prep_time_minutes && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-muted/20 rounded-lg">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span>Prep time: {product.prep_time_minutes} mins</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Information */}
              {product.vendor_id && (
                <div>
                  <h4 className="font-medium mb-2 text-xs sm:text-sm md:text-base">Vendor Information</h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Sold by</span>
                      <Link 
                        to={`/store/${product.vendor_id}`} 
                        className="text-primary hover:underline underline-offset-2 font-medium text-xs sm:text-sm min-h-[40px] flex items-center bg-background border rounded-lg px-3 py-2"
                      >
                        Visit store
                      </Link>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={isFollowing ? "secondary" : "outline"} onClick={toggle} disabled={followLoading || !product.vendor_id}>
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                        <span className="text-xs text-muted-foreground">{followersCount} followers</span>
                      </div>
                    </div>
                    {vendor?.member_discount_override_percent != null && vendor.member_discount_override_percent > 0 && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm p-2 bg-primary/10 rounded-lg">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <span>This vendor offers {vendor.member_discount_override_percent}% member discount</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <div className="order-2 space-y-3">
            {/* Delivery time (for hot food/perishables) */}
            {(product.product_kind === 'prepared_food' || product.perishable) && (
              <Card className="shadow-sm border-l-0 border-r-0 sm:border-l sm:border-r rounded-none sm:rounded-lg">
                <CardHeader className="pb-2 sm:pb-3 md:pb-6 p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Delivery Options</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium">Delivery time</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button" 
                          className={`px-3 py-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors min-h-[40px] sm:min-h-[44px] ${deliveryOption === 'asap' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`} 
                          onClick={() => setDeliveryOption('asap')}
                        >
                          ASAP
                        </button>
                        <button 
                          type="button" 
                          className={`px-3 py-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors min-h-[40px] sm:min-h-[44px] ${deliveryOption === 'schedule' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`} 
                          onClick={() => setDeliveryOption('schedule')}
                        >
                          Schedule
                        </button>
                      </div>
                      {deliveryOption === 'schedule' && (
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="w-full border rounded-lg px-3 py-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Rider delivery • {etaRangeText} ETA for ASAP.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <DeliveryMethodsCard
              productKind={product.product_kind}
              perishable={product.perishable}
              refrigerationRequired={product.refrigeration_required}
              allowEasyparcel={product.allow_easyparcel}
              allowRiderDelivery={product.allow_rider_delivery}
              prepTimeMinutes={product.prep_time_minutes}
              pickupLat={product.pickup_lat}
              pickupLng={product.pickup_lng}
              userLocation={userLocation}
              selectedMethod={deliveryMethod}
              onSelectDelivery={setDeliveryMethod}
            />
          </div>
        </div>

        {/* Trust Badges and Shipping - Single Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div>
            {deliveryMethod === 'easyparcel' && product.allow_easyparcel && (
              <ShippingEstimator 
                defaultWeightKg={product.weight_grams ? Math.max(0.1, product.weight_grams / 1000) : 1}
                productKind={product.product_kind}
                perishable={product.perishable}
                allowEasyparcel={product.allow_easyparcel}
              />
            )}
          </div>
          <div>
            <ProductTrustBadges />
          </div>
        </div>

        {/* Reviews Section - Full Width with Enhanced UI */}
        <section id="reviews" className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Review Summary and Distribution */}
            <div className="lg:col-span-1 space-y-4">
              <ReviewSummary targetType="product" targetId={product.id} />
              <ReviewRatingDistribution targetType="product" targetId={product.id} />
            </div>
            
            {/* Reviews List and Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reviews & Ratings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ReviewList targetType="product" targetId={product.id} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Write a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm targetType="product" targetId={product.id} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>

      {/* Enhanced Sticky Mobile CTA - More Prominent */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 border-t bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/95 z-50 shadow-xl">
        <div className="px-3 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-shrink">
            <div className="text-sm sm:text-base font-bold truncate">
              {fmtPrice(memberPrice || product.price_cents, product.currency)}
            </div>
            {memberPrice && (
              <div className="text-xs text-muted-foreground line-through">
                {fmtPrice(product.price_cents, product.currency)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="secondary" 
              onClick={addToCart} 
              size="sm" 
              className="h-9 px-3 text-xs"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Add
            </Button>
            <Button 
              variant="hero" 
              onClick={buyNow} 
              size="sm"
              className="h-9 px-4 text-xs font-semibold"
            >
              Buy now
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}