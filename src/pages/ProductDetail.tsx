import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import ReviewSummary from "@/components/reviews/ReviewSummary";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";

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
      
      // Load product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (productError) throw productError;
      if (!productData) {
        toast.error("Product not found");
        navigate('/catalog');
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
    <main className="container px-4 py-6 md:py-12">
      <div className="space-y-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Catalog", href: "/catalog" },
            { label: product.name },
          ]}
          className="mb-2"
        />

        {/* Hero Section - Product Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product Image Gallery */}
          <div className="lg:col-span-6 xl:col-span-5">
            <MediaGallery
              images={product.image_urls || []}
              videos={product.video_url ? [product.video_url] : []}
              alt={product.name}
              aspect="video"
            />
          </div>

          {/* Essential Product Info */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Package className="h-6 w-6 text-primary" />
                {product.name}
                {memberPrice && discountPercent > 0 && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    Members save {discountPercent}%
                  </span>
                )}
              </h1>
              <ShareButtons title={product.name} />
            </div>

            {product.vendor_id && (
              <div className="text-sm">
                <Link to={`/catalog?vendor=${product.vendor_id}`} className="underline underline-offset-2">View more from this vendor</Link>
              </div>
            )}

            {/* Pricing Section */}
            <Card>
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={addToCart} 
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to cart
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={buyNow}
                    className="flex items-center gap-2"
                  >
                    Buy now
                  </Button>
                  {product.vendor_id && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/chat?vendorId=${product.vendor_id}`)}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message seller
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Product Details Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description & Details */}
          <div className="space-y-6">
            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {product.stock_qty != null && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Stock: {product.stock_qty} available</span>
                    </div>
                  )}
                  {product.pickup_lat && product.pickup_lng && userLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Distance: {haversineKm(userLocation.lat, userLocation.lng, product.pickup_lat, product.pickup_lng).toFixed(1)} km away</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Options */}
          <div className="space-y-6">
            {/* Delivery time (for hot food/perishables) */}
            {(product.product_kind === 'prepared_food' || product.perishable) && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Delivery time</h4>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex items-center gap-2">
                        <button type="button" className={`px-3 py-1.5 rounded-md border text-sm ${deliveryOption === 'asap' ? 'bg-accent' : ''}`} onClick={() => setDeliveryOption('asap')}>ASAP</button>
                        <button type="button" className={`px-3 py-1.5 rounded-md border text-sm ${deliveryOption === 'schedule' ? 'bg-accent' : ''}`} onClick={() => setDeliveryOption('schedule')}>Schedule</button>
                      </div>
                      {deliveryOption === 'schedule' && (
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="border rounded-md px-3 py-1.5 text-sm"
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
        </section>

        {/* Additional Information Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ProductSpecificationsCard
              product={product}
              vendor={vendor ? { id: vendor.id } : undefined}
              userLocation={userLocation}
              onAddToCart={addToCart}
              onBuyNow={buyNow}
            />
          </div>

          <div className="space-y-6">
            {deliveryMethod === 'easyparcel' && product.allow_easyparcel && (
              <ShippingEstimator 
                defaultWeightKg={product.weight_grams ? Math.max(0.1, product.weight_grams / 1000) : 1}
                productKind={product.product_kind}
                perishable={product.perishable}
                allowEasyparcel={product.allow_easyparcel}
              />
            )}

            <ProductTrustBadges />
          </div>
        </section>

        {/* Reviews Section - Full Width */}
        <section id="reviews" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <ReviewSummary targetType="product" targetId={product.id} />
              </div>
              <ReviewList targetType="product" targetId={product.id} />
              <ReviewForm targetType="product" targetId={product.id} />
            </CardContent>
          </Card>
        </section>
      </div>
      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-base font-semibold">
            {fmtPrice(memberPrice || product.price_cents, product.currency)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={addToCart}>Add</Button>
            <Button variant="hero" onClick={buyNow}>Buy now</Button>
          </div>
        </div>
      </div>
    </main>
  );
}