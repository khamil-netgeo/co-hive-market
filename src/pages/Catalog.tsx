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
}

interface Vendor { id: string; member_discount_override_percent: number | null }
interface Community { id: string; name: string; member_discount_percent: number }

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorsById, setVendorsById] = useState<Record<string, Vendor>>({});
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [memberCommunities, setMemberCommunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  const [useNearMe, setUseNearMe] = useState(true);
  const [radiusKm, setRadiusKm] = useState(10);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setSEO(
      "Catalog | CoopMarket",
      "Browse products with member discounts. Join a community to save more on CoopMarket."
    );

    const load = async () => {
      try {
        const { data: productsData, error: pErr } = await supabase
          .from("products")
          .select("id,name,description,price_cents,currency,vendor_id,community_id,status,category,pickup_lat,pickup_lng")
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
        }));
        setProducts(prods);

        const vendorIds = Array.from(new Set(prods.map((p) => p.vendor_id))).filter(Boolean);
        const communityIds = Array.from(new Set(prods.map((p) => p.community_id))).filter(Boolean);

        const { data: sessionData } = await supabase.auth.getSession();

        const [vendRes, commRes, memberRes] = await Promise.all([
          vendorIds.length
            ? supabase
                .from("vendors")
                .select("id,member_discount_override_percent")
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
    const withDist = products.map((p) => {
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
  }, [products, loc, useNearMe, radiusKm]);
  const buyNow = async (p: Product) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: p.name,
          amount_cents: p.price_cents,
          currency: p.currency || "myr",
          success_path: "/payment-success",
          cancel_path: "/payment-canceled",
          product_id: p.id,
          vendor_id: p.vendor_id,
          community_id: p.community_id,
        },
      });
      if (error) throw error;
      window.open((data as any)?.url, "_blank");
    } catch (e: any) {
      toast("Checkout error", { description: e.message || String(e) });
    }
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
