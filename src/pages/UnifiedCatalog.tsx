import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductImage from "@/components/product/ProductImage";
import ServiceImage from "@/components/service/ServiceImage";
import { Package, Briefcase, MapPin, Clock, Star, ShoppingCart, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Unified item interface
interface CatalogItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id?: string;
  image_urls?: string[] | null;
  video_url?: string | null;
  
  // Product-specific fields
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  stock_qty?: number;
  
  // Service-specific fields
  duration_minutes?: number | null;
  service_area?: string | null;
  location_type?: string | null;
  availability_preset?: string | null;
}

interface Vendor { id: string; member_discount_override_percent: number | null }
interface Community { id: string; name: string; member_discount_percent: number }

export default function UnifiedCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [vendorsById, setVendorsById] = useState<Record<string, Vendor>>({});
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [memberCommunities, setMemberCommunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  
  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "products" | "services">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [useNearMe, setUseNearMe] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [itemCats, setItemCats] = useState<Record<string, string[]>>({});
  
  // Service booking state
  const [scheduleById, setScheduleById] = useState<Record<string, string>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  
  // Detail view state
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    setSEO(
      "Catalog | CoopMarket",
      "Browse products and services with member discounts. Shop or book everything in one place."
    );
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Load products and services in parallel
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,description,price_cents,currency,vendor_id,community_id,status,pickup_lat,pickup_lng,image_urls,video_url,stock_qty")
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("vendor_services")
          .select("id,vendor_id,name,subtitle,description,price_cents,currency,status,duration_minutes,service_area,location_type,availability_preset,image_urls")
          .eq("status", "active")
          .order("created_at", { ascending: false })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      // Transform and combine data
      const products: CatalogItem[] = (productsRes.data || []).map((p: any) => ({
        ...p,
        type: 'product' as const,
        community_id: p.community_id,
      }));

      const services: CatalogItem[] = (servicesRes.data || []).map((s: any) => ({
        ...s,
        type: 'service' as const,
        community_id: null, // Services don't have community_id in current schema
      }));

      const allItems = [...products, ...services];
      setItems(allItems);

      // Get vendor and community IDs
      const vendorIds = Array.from(new Set(allItems.map(item => item.vendor_id))).filter(Boolean);
      const communityIds = Array.from(new Set(products.map(p => p.community_id))).filter(Boolean);
      const productIds = products.map(p => p.id);
      const serviceIds = services.map(s => s.id);

      const { data: sessionData } = await supabase.auth.getSession();

      // Load related data
      const [vendRes, commRes, memberRes, catRes, pcRes, scRes] = await Promise.all([
        vendorIds.length ? supabase.from("vendors").select("id,member_discount_override_percent").in("id", vendorIds) : Promise.resolve({ data: [], error: null }),
        communityIds.length ? supabase.from("communities").select("id,name,member_discount_percent").in("id", communityIds) : Promise.resolve({ data: [], error: null }),
        sessionData.session ? supabase.from("community_members").select("community_id") : Promise.resolve({ data: [], error: null }),
        supabase.from("categories").select("id,name,type,is_active,sort_order").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
        productIds.length ? supabase.from("product_categories").select("product_id,category_id").in("product_id", productIds) : Promise.resolve({ data: [], error: null }),
        serviceIds.length ? supabase.from("service_categories").select("service_id,category_id").in("service_id", serviceIds) : Promise.resolve({ data: [], error: null }),
      ]);

      // Process vendors
      const vMap: Record<string, Vendor> = {};
      (vendRes.data as any[] || []).forEach((v) => (vMap[v.id] = v));
      setVendorsById(vMap);

      // Process communities
      const cMap: Record<string, Community> = {};
      (commRes.data as any[] || []).forEach((c) => (cMap[c.id] = c));
      setCommunitiesById(cMap);

      // Process member communities
      const mSet = new Set<string>();
      (memberRes.data as any[] || []).forEach((m) => mSet.add(m.community_id));
      setMemberCommunities(mSet);

      // Process categories
      setCategories(((catRes.data as any[]) || []).map((c: any) => ({ id: c.id, name: c.name })));
      
      // Process item-category mapping
      const icMap: Record<string, string[]> = {};
      ((pcRes.data as any[]) || []).forEach((r: any) => {
        (icMap[r.product_id] ||= []).push(r.category_id);
      });
      ((scRes.data as any[]) || []).forEach((r: any) => {
        (icMap[r.service_id] ||= []).push(r.category_id);
      });
      setItemCats(icMap);

    } catch (e: any) {
      toast("Failed to load catalog", { description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  // Get buyer location
  useEffect(() => {
    const initLoc = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const { data } = await supabase.from("profiles").select("latitude,longitude").maybeSingle();
          if (data?.latitude && data?.longitude) {
            setLoc({ lat: data.latitude, lng: data.longitude });
            return;
          }
        }
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => void 0,
            { enableHighAccuracy: true, timeout: 8000 }
          );
        }
      } catch {}
    };
    initLoc();
  }, []);

  useEffect(() => {
    load();
  }, []);

  // Haversine distance (km) - moved before usage
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filtering and sorting logic
  const filtered = useMemo(() => {
    let result = [...items];

    // Filter by type
    if (activeTab !== "all") {
      result = result.filter(item => item.type === activeTab.slice(0, -1)); // "products" -> "product"
    }

    // Search filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) || 
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.subtitle ?? "").toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(item => (itemCats[item.id] || []).includes(categoryFilter));
    }

    // Location filter for products
    if (useNearMe && loc) {
      result = result.filter(item => {
        if (item.type === 'service') return true; // Keep all services
        return item.pickup_lat != null && item.pickup_lng != null &&
          haversineKm(loc.lat, loc.lng, item.pickup_lat, item.pickup_lng) <= radiusKm;
      });
    }

    // Sort
    if (sort === "price_asc") result.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
    else if (sort === "price_desc") result.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));

    return result;
  }, [items, activeTab, query, categoryFilter, itemCats, useNearMe, loc, radiusKm, sort]);

  const fmtPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    const code = currency?.toUpperCase?.() || "USD";
    return new Intl.NumberFormat(code === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: code }).format(amount);
  };

  const effectiveDiscountPercent = (item: CatalogItem) => {
    if (!item.community_id) return 0;
    const vendor = vendorsById[item.vendor_id];
    if (vendor && vendor.member_discount_override_percent != null) return vendor.member_discount_override_percent;
    const community = communitiesById[item.community_id];
    return community?.member_discount_percent ?? 0;
  };

  const memberPrice = (item: CatalogItem) => {
    if (!item.community_id) return null;
    const isMember = memberCommunities.has(item.community_id);
    if (!isMember) return null;
    const disc = effectiveDiscountPercent(item);
    const discounted = Math.round(item.price_cents * (1 - (disc || 0) / 100));
    return discounted;
  };


  // Actions
  const addToCart = (item: CatalogItem) => {
    if (item.type !== 'product') return;
    
    const vendorMismatch = cart.vendor_id && cart.vendor_id !== item.vendor_id;
    const currencyMismatch = cart.currency && cart.currency.toUpperCase() !== (item.currency || "usd").toUpperCase();
    if (vendorMismatch || currencyMismatch) {
      toast("Single vendor cart", { description: "Please checkout or clear your current cart before adding items from another vendor or currency." });
      return;
    }
    cart.add({
      product_id: item.id,
      name: item.name,
      price_cents: item.price_cents,
      currency: item.currency,
      vendor_id: item.vendor_id,
      community_id: item.community_id || "",
    }, 1);
    toast.success("Added to cart");
  };

  const buyNow = async (item: CatalogItem) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: item.type === 'product' ? item.name : `Service: ${item.name}`,
          amount_cents: item.price_cents,
          currency: item.currency || "myr",
          success_path: "/payment-success",
          cancel_path: "/payment-canceled",
          ...(item.type === 'product' ? { product_id: item.id } : {}),
          vendor_id: item.vendor_id,
          community_id: item.community_id,
        },
      });
      if (error) throw error;
      window.open((data as any)?.url, "_blank");
    } catch (e: any) {
      toast("Checkout error", { description: e.message || String(e) });
    }
  };

  const bookService = async (service: CatalogItem) => {
    if (service.type !== 'service') return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to book services." });
        window.location.href = "/auth";
        return;
      }
      const buyerId = sessionData.session.user.id;
      const when = scheduleById[service.id] ? new Date(scheduleById[service.id]).toISOString() : null;
      
      // Create a booking row first
      const { data: bookingRows, error: bookingErr } = await supabase
        .from("service_bookings")
        .insert({
          service_id: service.id,
          buyer_user_id: buyerId,
          scheduled_at: when,
          total_amount_cents: service.price_cents,
          currency: service.currency,
          notes: (notesById[service.id]?.trim() || null),
        })
        .select("id")
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      const bookingId = (bookingRows as any)?.id;

      // Fetch vendor's community for proper ledger attribution
      const { data: vendorRow, error: vErr } = await supabase
        .from("vendors")
        .select("community_id")
        .eq("id", service.vendor_id)
        .maybeSingle();
      if (vErr) throw vErr;
      const communityId = (vendorRow as any)?.community_id as string | undefined;

      // Start Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Service: ${service.name}`,
          amount_cents: service.price_cents,
          currency: service.currency || "myr",
          success_path: `/payment-success?booking_id=${bookingId}`,
          cancel_path: "/payment-canceled",
          vendor_id: service.vendor_id,
          community_id: communityId,
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

  const handleJoinCTA = async (communityId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to join communities and unlock discounts." });
        window.location.href = "/auth";
        return;
      }
      const userId = sessionData.session.user.id;
      const { error } = await supabase
        .from("community_members")
        .upsert(
          { community_id: communityId, user_id: userId, member_type: "buyer" },
          { onConflict: "community_id,user_id,member_type" }
        );
      if (error) throw error;
      setMemberCommunities((prev) => new Set(prev).add(communityId));
      toast("Joined community", { description: "Member discount is now applied." });
    } catch (e: any) {
      toast("Unable to proceed", { description: e.message || String(e) });
    }
  };

  return (
    <main className="container px-4 py-6 md:py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Catalog</h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Browse products and services. Member discounts apply automatically.
          </p>
        </div>

        {/* Type Filter Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="all" className="flex items-center gap-2 py-3">
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2 py-3">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 py-3">
              <Briefcase className="h-4 w-4" />
              <span>Services</span>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="mt-6 space-y-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products and services..."
              aria-label="Search catalog"
              className="w-full"
            />
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Location Filter (Products only) */}
              {(activeTab === "all" || activeTab === "products") && (
                <>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="near">Near me</Label>
                    <Switch id="near" checked={useNearMe} onCheckedChange={setUseNearMe} />
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-80 min-w-0">
                    <Label className="whitespace-nowrap text-sm">Radius: {radiusKm}km</Label>
                    <Slider
                      value={[radiusKm]}
                      onValueChange={(v) => setRadiusKm(v[0] ?? 10)}
                      min={1}
                      max={50}
                      step={1}
                      disabled={!loc}
                    />
                    {!loc && <span className="text-xs text-muted-foreground">Enable location</span>}
                  </div>
                </>
              )}
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap text-sm">Category</Label>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap text-sm">Sort</Label>
                <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Newest" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results */}
          <TabsContent value={activeTab} className="mt-8">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-md border bg-card p-6 text-muted-foreground">
                No items found. Try adjusting your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => {
                  const discounted = memberPrice(item);
                  const discPercent = effectiveDiscountPercent(item);

                  return (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Card key={`${item.type}-${item.id}`} className="hover:shadow-elegant transition-shadow cursor-pointer group">
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            {item.type === 'product' ? (
                              <ProductImage 
                                imageUrls={item.image_urls} 
                                productName={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                fallbackClassName="w-full h-full bg-muted flex items-center justify-center"
                              />
                            ) : (
                              <ServiceImage 
                                imageUrls={item.image_urls}
                                serviceName={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>
                          
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {item.type === 'product' ? (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="line-clamp-1">{item.name}</span>
                              </div>
                              {discounted != null && discPercent > 0 && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary whitespace-nowrap">
                                  {discPercent}% off
                                </span>
                              )}
                            </CardTitle>
                            {item.subtitle && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{item.subtitle}</p>
                            )}
                          </CardHeader>
                          
                          <CardContent className="grid gap-3">
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            )}
                            
                            {/* Type-specific info */}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {item.type === 'service' && typeof item.duration_minutes === "number" && item.duration_minutes > 0 && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{item.duration_minutes} min</span>
                                </div>
                              )}
                              {item.type === 'service' && item.service_area && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{item.service_area}</span>
                                </div>
                              )}
                              {item.type === 'product' && item.pickup_lat && item.pickup_lng && loc && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{haversineKm(loc.lat, loc.lng, item.pickup_lat, item.pickup_lng).toFixed(1)} km away</span>
                                </div>
                              )}
                            </div>

                            {/* Pricing */}
                            <div className="text-xl font-semibold">
                              {discounted != null ? (
                                <div className="flex items-baseline gap-2">
                                  <span className="text-primary">{fmtPrice(discounted, item.currency)}</span>
                                  <span className="text-sm text-muted-foreground line-through">
                                    {fmtPrice(item.price_cents, item.currency)}
                                  </span>
                                </div>
                              ) : (
                                <span>{fmtPrice(item.price_cents, item.currency)}</span>
                              )}
                            </div>

                            {/* Click hint */}
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>Click for details</span>
                              <span>→</span>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>

                      {/* Detailed View Dialog */}
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {item.type === 'product' ? (
                              <Package className="h-5 w-5 text-primary" />
                            ) : (
                              <Briefcase className="h-5 w-5 text-primary" />
                            )}
                            {item.name}
                            {discounted != null && discPercent > 0 && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                Members save {discPercent}%
                              </span>
                            )}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Image Section */}
                          <div className="space-y-4">
                            <div className="aspect-video w-full overflow-hidden rounded-lg">
                              {item.type === 'product' ? (
                                <ProductImage 
                                  imageUrls={item.image_urls} 
                                  productName={item.name}
                                  className="w-full h-full object-cover"
                                  fallbackClassName="w-full h-full bg-muted flex items-center justify-center"
                                />
                              ) : (
                                <ServiceImage 
                                  imageUrls={item.image_urls}
                                  serviceName={item.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            
                            {/* Additional Images */}
                            {item.image_urls && item.image_urls.length > 1 && (
                              <div className="grid grid-cols-3 gap-2">
                                {item.image_urls.slice(1, 4).map((url, idx) => (
                                  <div key={idx} className="aspect-square overflow-hidden rounded">
                                    <img 
                                      src={url} 
                                      alt={`${item.name} image ${idx + 2}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Details Section */}
                          <div className="space-y-6">
                            {item.subtitle && (
                              <p className="text-lg text-muted-foreground">{item.subtitle}</p>
                            )}

                            {item.description && (
                              <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                              </div>
                            )}

                            {/* Type-specific details */}
                            <div className="space-y-4">
                              <h3 className="font-semibold">Details</h3>
                              <div className="grid gap-3">
                                {item.type === 'service' ? (
                                  <>
                                    {typeof item.duration_minutes === "number" && item.duration_minutes > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>Duration: {item.duration_minutes} minutes</span>
                                      </div>
                                    )}
                                    {item.service_area && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>Service area: {item.service_area}</span>
                                      </div>
                                    )}
                                    {item.location_type && (
                                      <div className="flex items-center gap-2">
                                        <span>Location type: {item.location_type}</span>
                                      </div>
                                    )}
                                    {item.availability_preset && (
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Availability: {item.availability_preset}</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {item.stock_qty != null && (
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span>Stock: {item.stock_qty} available</span>
                                      </div>
                                    )}
                                    {item.pickup_lat && item.pickup_lng && loc && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>Distance: {haversineKm(loc.lat, loc.lng, item.pickup_lat, item.pickup_lng).toFixed(1)} km away</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Pricing */}
                            <div className="space-y-2">
                              <h3 className="font-semibold">Pricing</h3>
                              <div className="text-3xl font-bold">
                                {discounted != null ? (
                                  <div className="flex items-baseline gap-3">
                                    <span className="text-primary">{fmtPrice(discounted, item.currency)}</span>
                                    <span className="text-lg text-muted-foreground line-through">
                                      {fmtPrice(item.price_cents, item.currency)}
                                    </span>
                                  </div>
                                ) : (
                                  <span>{fmtPrice(item.price_cents, item.currency)}</span>
                                )}
                              </div>
                            </div>

                            {/* Community join CTA */}
                            {discounted == null && discPercent > 0 && item.community_id && (
                              <div className="rounded-lg border bg-card p-4">
                                <div className="text-sm mb-3">
                                  <Star className="h-4 w-4 inline mr-1 text-primary" />
                                  Join {communitiesById[item.community_id]?.name || "this community"} to save {discPercent}% and pay {fmtPrice(Math.round(item.price_cents * (1 - discPercent / 100)), item.currency)}.
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => handleJoinCTA(item.community_id!)}>
                                  Join community to save
                                </Button>
                              </div>
                            )}

                            {/* Service booking fields in dialog */}
                            {item.type === 'service' && (
                              <div className="space-y-4">
                                <h3 className="font-semibold">Book this service</h3>
                                <div className="grid gap-3">
                                  <div>
                                    <Label htmlFor={`dialog-dt-${item.id}`} className="text-sm font-medium">
                                      Preferred date & time (optional)
                                    </Label>
                                    <Input
                                      id={`dialog-dt-${item.id}`}
                                      type="datetime-local"
                                      value={scheduleById[item.id] || ""}
                                      onChange={(e) =>
                                        setScheduleById((m) => ({ ...m, [item.id]: e.target.value }))
                                      }
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`dialog-note-${item.id}`} className="text-sm font-medium">
                                      Notes (optional)
                                    </Label>
                                    <Textarea
                                      id={`dialog-note-${item.id}`}
                                      value={notesById[item.id] || ""}
                                      onChange={(e) =>
                                        setNotesById((m) => ({ ...m, [item.id]: e.target.value }))
                                      }
                                      placeholder="Add special instructions..."
                                      rows={3}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-3">
                              {item.type === 'product' ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <Button 
                                    variant="secondary" 
                                    onClick={(e) => { e.stopPropagation(); addToCart(item); }} 
                                    className="flex items-center gap-2"
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                    Add to cart
                                  </Button>
                                  <Button 
                                    variant="hero" 
                                    onClick={(e) => { e.stopPropagation(); buyNow(item); }}
                                    className="flex items-center gap-2"
                                  >
                                    Buy now
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="hero" 
                                  onClick={(e) => { e.stopPropagation(); bookService(item); }}
                                  className="w-full flex items-center gap-2"
                                >
                                  <Calendar className="h-4 w-4" />
                                  Book & Pay
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}