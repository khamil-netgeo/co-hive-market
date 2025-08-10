import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ProductImage from "@/components/product/ProductImage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id: string;
  category?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  allow_rider_delivery?: boolean | null;
  allow_easyparcel?: boolean | null;
  product_kind?: string | null;
  perishable?: boolean | null;
  prep_time_minutes?: number | null;
}

interface Vendor { id: string; member_discount_override_percent: number | null; opening_hours?: any | null; delivery_radius_km?: number | null }
interface Community { id: string; name: string; member_discount_percent: number }

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorsById, setVendorsById] = useState<Record<string, Vendor>>({});
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [memberCommunities, setMemberCommunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  const navigate = useNavigate();
  const [useNearMe, setUseNearMe] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  // Category filter state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [productCats, setProductCats] = useState<Record<string, string[]>>({});
  // Type filter (Food vs Groceries)
  const location = useLocation();
const initialType = location.pathname.includes('/food') ? 'food' : location.pathname.includes('/groceries') ? 'grocery' : 'all';
const [typeFilter, setTypeFilter] = useState<'all' | 'food' | 'grocery'>(initialType);
const [deliveryFilter, setDeliveryFilter] = useState<'any' | 'rider' | 'parcel'>('any');
const [perishableOnly, setPerishableOnly] = useState(false);
const [openNow, setOpenNow] = useState(false);

  useEffect(() => {
    setSEO(
      "Catalog | CoopMarket",
      "Browse products with member discounts. Join a community to save more on CoopMarket."
    );

    const load = async () => {
      try {
        const { data: productsData, error: pErr } = await supabase
          .from("products")
          .select("id,name,description,price_cents,currency,vendor_id,community_id,status,category,pickup_lat,pickup_lng,image_urls,video_url,allow_rider_delivery,allow_easyparcel,product_kind,perishable,prep_time_minutes")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (pErr) throw pErr;
        const prods = ((productsData as any[]) || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price_cents: p.price_cents,
          currency: p.currency,
          vendor_id: p.vendor_id,
          community_id: p.community_id,
          category: p.category ?? null,
          pickup_lat: p.pickup_lat ?? null,
          pickup_lng: p.pickup_lng ?? null,
          image_urls: p.image_urls ?? null,
          video_url: p.video_url ?? null,
          allow_rider_delivery: p.allow_rider_delivery ?? null,
          allow_easyparcel: p.allow_easyparcel ?? null,
          product_kind: p.product_kind ?? null,
          perishable: p.perishable ?? null,
          prep_time_minutes: p.prep_time_minutes ?? null,
        }));
        setProducts(prods);

        const vendorIds = Array.from(new Set(prods.map((p) => p.vendor_id))).filter(Boolean);
        const communityIds = Array.from(new Set(prods.map((p) => p.community_id))).filter(Boolean);

        const { data: sessionData } = await supabase.auth.getSession();

        const productIds = prods.map((p) => p.id);
        const [vendRes, commRes, memberRes, catRes, pcRes] = await Promise.all([
          vendorIds.length
            ? supabase
                .from("vendors")
                .select("id,member_discount_override_percent,opening_hours,delivery_radius_km")
                .in("id", vendorIds)
            : Promise.resolve({ data: [], error: null } as any),
          communityIds.length
            ? supabase
                .from("communities")
                .select("id,name,member_discount_percent")
                .in("id", communityIds)
            : Promise.resolve({ data: [], error: null } as any),
          sessionData.session
            ? supabase
                .from("community_members")
                .select("community_id")
            : Promise.resolve({ data: [], error: null } as any),
          supabase
            .from("categories")
            .select("id,name,type,is_active,sort_order")
            .eq("is_active", true)
            .in("type", ["products", "both"])
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
          productIds.length
            ? supabase
                .from("product_categories")
                .select("product_id,category_id")
                .in("product_id", productIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        if (vendRes.error) throw vendRes.error;
        if (commRes.error) throw commRes.error;
        if (memberRes.error) throw memberRes.error;

        const vMap: Record<string, Vendor> = {};
        (vendRes.data as any[]).forEach((v) => (vMap[v.id] = v));
        setVendorsById(vMap);
 
        const cMap: Record<string, Community> = {};
        (commRes.data as any[]).forEach((c) => (cMap[c.id] = c));
        setCommunitiesById(cMap);
 
        const mSet = new Set<string>();
        (memberRes.data as any[]).forEach((m) => mSet.add(m.community_id));
        setMemberCommunities(mSet);

        // Categories and product-category mapping
        setCategories(((catRes.data as any[]) || []).map((c: any) => ({ id: c.id, name: c.name })));
        const pm: Record<string, string[]> = {};
        ((pcRes.data as any[]) || []).forEach((r: any) => {
          (pm[r.product_id] ||= []).push(r.category_id);
        });
        setProductCats(pm);
      } catch (e: any) {
        toast("Failed to load catalog", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Get buyer location: profile lat/lng first, fallback to browser geolocation
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

  // Filters: type, category, delivery method, perishable, open now
  const productsFiltered = useMemo(() => {
    const now = new Date();
    const dayKeys = ["sun","mon","tue","wed","thu","fri","sat"] as const;
    const dayKey = dayKeys[now.getDay()];
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const isVendorOpen = (vendorId: string) => {
      const v = vendorsById[vendorId];
      const oh: any = v?.opening_hours;
      if (!oh || !oh[dayKey]) return true; // if not configured, consider open
      if (oh[dayKey].closed) return false;
      const [oH, oM] = String(oh[dayKey].open || "00:00").split(":").map((s: string) => parseInt(s, 10));
      const [cH, cM] = String(oh[dayKey].close || "23:59").split(":").map((s: string) => parseInt(s, 10));
      const openMin = (oH || 0) * 60 + (oM || 0);
      const closeMin = (cH || 23) * 60 + (cM || 59);
      return minutesNow >= openMin && minutesNow <= closeMin;
    };

    let base = products;
    if (typeFilter !== "all") base = base.filter((p) => (p.category || "") === typeFilter);
    if (categoryFilter !== "all") base = base.filter((p) => (productCats[p.id] || []).includes(categoryFilter));

    if (deliveryFilter === 'rider') base = base.filter((p) => p.allow_rider_delivery);
    if (deliveryFilter === 'parcel') base = base.filter((p) => p.allow_easyparcel);

    if (perishableOnly) base = base.filter((p) => p.perishable || p.product_kind === 'prepared_food');

    if (openNow) base = base.filter((p) => isVendorOpen(p.vendor_id));

    return base;
  }, [products, productCats, categoryFilter, typeFilter, deliveryFilter, perishableOnly, openNow, vendorsById]);
 
 
   const fmtPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    const code = currency?.toUpperCase?.() || "USD";
    return new Intl.NumberFormat(code === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: code }).format(amount);
  };

  const effectiveDiscountPercent = (p: Product) => {
    const vendor = vendorsById[p.vendor_id];
    if (vendor && vendor.member_discount_override_percent != null) return vendor.member_discount_override_percent;
    const community = communitiesById[p.community_id];
    return community?.member_discount_percent ?? 0;
  };

  const memberPrice = (p: Product) => {
    const isMember = memberCommunities.has(p.community_id);
    if (!isMember) return null;
    const disc = effectiveDiscountPercent(p);
    const discounted = Math.round(p.price_cents * (1 - (disc || 0) / 100));
    return discounted;
  };

  // Haversine distance (km)
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

  const productsNear = useMemo(() => {
    const withDist = productsFiltered.map((p) => {
      const d = loc && p.pickup_lat != null && p.pickup_lng != null
        ? haversineKm(loc.lat, loc.lng, p.pickup_lat as number, p.pickup_lng as number)
        : null;
      return { ...(p as any), _distanceKm: d } as any;
    });
    if (useNearMe && loc) {
      return withDist
        .filter((x: any) => x._distanceKm != null && x._distanceKm <= radiusKm)
        .sort((a: any, b: any) => (a._distanceKm ?? 0) - (b._distanceKm ?? 0));
    }
    return withDist;
  }, [productsFiltered, loc, useNearMe, radiusKm]);
  const buyNow = async (p: Product) => {
    const vendorMismatch = cart.vendor_id && cart.vendor_id !== p.vendor_id;
    const currencyMismatch = cart.currency && cart.currency.toUpperCase() !== (p.currency || "usd").toUpperCase();
    if (vendorMismatch || currencyMismatch) {
      toast("Single vendor cart", { description: "Please checkout or clear your current cart before buying from another vendor or currency." });
      return;
    }
    cart.add({
      product_id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      currency: p.currency,
      vendor_id: p.vendor_id,
      community_id: p.community_id,
    }, 1);
    navigate("/checkout");
  };

  const addToCart = (p: Product) => {
    const vendorMismatch = cart.vendor_id && cart.vendor_id !== p.vendor_id;
    const currencyMismatch = cart.currency && cart.currency.toUpperCase() !== (p.currency || "usd").toUpperCase();
    if (vendorMismatch || currencyMismatch) {
      toast("Single vendor cart", { description: "Please checkout or clear your current cart before adding items from another vendor or currency." });
      return;
    }
    cart.add({
      product_id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      currency: p.currency,
      vendor_id: p.vendor_id,
      community_id: p.community_id,
    }, 1);
    toast.success("Added to cart");
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
    <main className="container py-12 md:py-16">
      <h1 className="text-3xl font-semibold">Catalog</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Member discounts apply automatically when you’re a member of the product’s community.
        </p>
        <div className="mt-4">
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="food">Food</TabsTrigger>
              <TabsTrigger value="grocery">Groceries</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
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
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-sm">Delivery</Label>
            <Select value={deliveryFilter} onValueChange={(v) => setDeliveryFilter(v as any)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Any method" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="rider">Riders only</SelectItem>
                <SelectItem value="parcel">EasyParcel ok</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="perishable" className="whitespace-nowrap text-sm">Perishable only</Label>
            <Switch id="perishable" checked={perishableOnly} onCheckedChange={setPerishableOnly} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="open-now" className="whitespace-nowrap text-sm">Open now</Label>
            <Switch id="open-now" checked={openNow} onCheckedChange={setOpenNow} />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-muted-foreground">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-md border bg-card p-6 text-muted-foreground">No products yet.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {productsNear.map((p: any) => {
              const discounted = memberPrice(p);
              const discPercent = effectiveDiscountPercent(p);
              return (
                <Card key={p.id} className="hover:shadow-elegant transition-shadow">
                  <ProductImage 
                    imageUrls={p.image_urls} 
                    productName={p.name}
                    className="w-full h-48 object-cover rounded-t-md"
                    fallbackClassName="w-full h-48 bg-muted rounded-t-md flex items-center justify-center"
                  />
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>{p.name}</span>
                      {discounted != null && discPercent > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Members save {discPercent}%
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {p.description && (
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    )}
                    {p._distanceKm != null && (
                      <div className="text-xs text-muted-foreground">Distance: {p._distanceKm.toFixed(1)} km</div>
                    )}
                    <div className="text-2xl font-semibold">
                      {discounted != null ? (
                        <div className="flex items-baseline gap-2">
                          <span>{fmtPrice(discounted, p.currency)}</span>
                          <span className="text-base text-muted-foreground line-through">
                            {fmtPrice(p.price_cents, p.currency)}
                          </span>
                        </div>
                      ) : (
                        <span>{fmtPrice(p.price_cents, p.currency)}</span>
                      )}
                    </div>

                    {(p.category === 'food' || p.category === 'grocery') && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{p.category === 'food' ? 'ETA 30-60 mins via riders' : 'Local delivery available'}</span>
                      </div>
                    )}

                    {discounted == null && discPercent > 0 && (
                      <div className="rounded-md border bg-card p-3">
                        <div className="text-sm">
                          Join {communitiesById[p.community_id]?.name || "this community"} to save {discPercent}% and pay {fmtPrice(Math.round(p.price_cents * (1 - discPercent / 100)), p.currency)}.
                        </div>
                        <div className="mt-2">
                          <Button size="sm" variant="secondary" onClick={() => handleJoinCTA(p.community_id)}>
                            Join community to save
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="secondary" onClick={() => addToCart(p)} className="w-full sm:w-auto">Add to cart</Button>
                      <Button variant="hero" onClick={() => buyNow(p)} className="w-full sm:w-auto">Buy now</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    );
  }
