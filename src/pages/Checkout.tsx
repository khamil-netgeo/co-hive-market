import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useRiderPreference, determineDeliveryMethod } from "@/hooks/useRiderPreference";

export default function Checkout() {
  const cart = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { preference } = useRiderPreference();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounting, setMounting] = useState(true);
  // Keep a single Embedded Checkout instance per page
  const checkoutRef = useRef<any>(null);
  const initOnceRef = useRef(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useMemo(() => setSEO("Checkout | CoopMarket", "Secure, embedded checkout without leaving the app."), []);

  const shippingCents = (location.state as any)?.shippingCents ?? 0;
  const totalCents = cart.subtotal_cents + shippingCents;

  useEffect(() => {
    (async () => {
      const ids = cart.items.map((i) => i.product_id);
      if (!ids.length) return;
      const { data: prods } = await supabase
        .from('products')
        .select('id,image_urls')
        .in('id', ids);
      const map: Record<string, string> = {};
      (prods || []).forEach((p: any) => {
        const u = p?.image_urls?.[0];
        if (u) map[p.id] = u;
      });
      setProductImages(map);
    })();
  }, [cart.items.map((i) => i.product_id).join(',')]);

  useEffect(() => {
    (async () => {
      if (cart.items.length === 0) {
        navigate("/cart");
        return;
      }
      // Prevent multiple Embedded Checkout instances (React StrictMode or re-renders)
      if (checkoutRef.current || initOnceRef.current) {
        setMounting(false);
        return;
      }
      initOnceRef.current = true;
      try {
        // Require sign-in regardless of entry point
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          toast("Sign in required", { description: "Please sign in to continue to checkout." });
          navigate("/auth", { state: { redirect: "/checkout" } });
          return;
        }

        // Determine delivery method using user preference and product constraints first
        const firstId = cart.items[0]?.product_id as string | undefined;
        let deliveryMethod: 'rider' | 'easyparcel' = 'rider';
        let nearbyRiders = false;
        if (firstId) {
          const { data: prod } = await supabase
            .from('products')
            .select('product_kind, perishable, allow_easyparcel, allow_rider_delivery, pickup_lat, pickup_lng')
            .eq('id', firstId)
            .maybeSingle();

          if (prod?.pickup_lat && prod?.pickup_lng) {
            const { data: riders } = await supabase.rpc('find_nearby_riders', {
              pickup_lat: prod.pickup_lat,
              pickup_lng: prod.pickup_lng,
              max_distance_km: 10
            });
            nearbyRiders = (riders?.length || 0) > 0;
          }

          deliveryMethod = determineDeliveryMethod(
            preference,
            prod?.product_kind,
            prod?.perishable,
            prod?.allow_easyparcel,
            prod?.allow_rider_delivery,
            nearbyRiders
          );
        }
        
        // Require EasyParcel rates selection before proceeding
        if (deliveryMethod === 'easyparcel' && (!shippingCents || shippingCents <= 0)) {
          toast("Select shipping", { description: "Please fetch EasyParcel rates and select a courier before checkout." });
          navigate("/cart");
          setMounting(false);
          return;
        }
        
        // Only require full address for rider delivery (drop-off coords, etc.)
        if (deliveryMethod === 'rider') {
          const userId = sessionData.session.user.id;
          const { data: prof } = await supabase
            .from("profiles")
            .select("latitude,longitude,address_line1,city,postcode,phone")
            .eq("id", userId)
            .maybeSingle();
          const missing = !prof || !prof.latitude || !prof.longitude || !prof.address_line1 || !prof.city || !prof.postcode || !prof.phone;
          if (missing) {
            toast("Add delivery details", { description: "Please set your drop-off address before checkout." });
            navigate("/delivery-details", { state: { redirect: "/checkout" } });
            return;
          }
        }

        // Enforce Stripe currency minimum before creating session
        const cur = String(cart.currency || "usd").toLowerCase();
        const minByCurrency: Record<string, number> = { myr: 200, usd: 50, eur: 50, gbp: 30 };
        const minCents = minByCurrency[cur] ?? 50;
        if (totalCents < minCents) {
          const human = cur.toUpperCase();
          toast("Minimum order", { description: `Minimum charge is ${human} ${(minCents/100).toFixed(2)}. Please add more items.` });
          setMounting(false);
          return;
        }

        const { data: cfg, error: cfgErr } = await supabase.functions.invoke("stripe-config");
        if (cfgErr) throw cfgErr;
        const pk = (cfg as any)?.publishableKey;
        if (!pk) throw new Error("Stripe publishable key missing");

        const stripe = await loadStripe(pk);
        if (!stripe) throw new Error("Failed to load Stripe.js");

        // Compute total weight in grams from products; default 500g each if unknown
        const ids = cart.items.map(i => i.product_id);
        let totalWeightGrams = 0;
        if (ids.length > 0) {
          const { data: weightRows } = await supabase
            .from('products')
            .select('id, weight_grams')
            .in('id', ids);
          const weightMap = new Map((weightRows || []).map(r => [r.id, r.weight_grams as number | null]));
          for (const it of cart.items) {
            const w = weightMap.get(it.product_id);
            const perItem = (typeof w === 'number' && w > 0) ? w : 500; // 0.5kg fallback
            totalWeightGrams += perItem * it.quantity;
          }
        }

        // Snapshot the cart to persist line items for order creation
        let snapshotId: string | null = null;
        try {
          const userId = sessionData.session.user.id;
          if (userId) {
            const { data: snap } = await supabase
              .from("cart_snapshots")
              .insert({
                user_id: userId,
                vendor_id: cart.vendor_id,
                currency: cart.currency,
                items: cart.items,
              })
              .select("id")
              .single();
            snapshotId = (snap as any)?.id ?? null;
          }
        } catch (_) {
          // Non-fatal; order will still be created without item details
        }

        const { data, error } = await supabase.functions.invoke("create-embedded-checkout", {
          body: {
            name: `Cart purchase (${cart.count} item${cart.count > 1 ? "s" : ""})`,
            amount_cents: totalCents,
            currency: cart.currency,
            success_path: "/payment-success",
            vendor_id: cart.vendor_id,
            community_id: cart.community_id,
            product_id: cart.items[0]?.product_id,
            delivery_method: deliveryMethod,
            total_weight_grams: totalWeightGrams,
            snapshot_id: snapshotId,
            shipping_cents: shippingCents,
          },
        });
        if (error) {
          const errMsg = (error as any)?.message || (data as any)?.error || "Checkout failed";
          // Surface minimum charge guidance for MYR
          if (String(cart.currency || "").toLowerCase() === "myr" && /Minimum charge/i.test(String(errMsg))) {
            toast("Minimum order", { description: "Stripe requires at least RM2.00. Please add more items." });
          } else {
            toast("Checkout error", { description: errMsg });
          }
          throw error;
        }
        const clientSecret = (data as any)?.client_secret;
        if (!clientSecret) throw new Error("No client_secret returned");

        // Ensure any previous instance is cleared before creating a new one
        try { checkoutRef.current?.destroy?.(); } catch {}
        const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
        checkoutRef.current = checkout;
        if (containerRef.current) checkout.mount(containerRef.current);
        setMounting(false);
      } catch (e: any) {
        // Fallback to hosted Stripe Checkout if Embedded fails
        try {
          const { data: fallback, error: fbErr } = await supabase.functions.invoke("create-payment", {
            body: {
              name: `Cart purchase (${cart.count} item${cart.count > 1 ? "s" : ""})`,
              amount_cents: totalCents,
              currency: cart.currency,
              success_path: "/payment-success",
              cancel_path: "/payment-canceled",
              vendor_id: cart.vendor_id,
              community_id: cart.community_id,
              product_id: cart.items[0]?.product_id,
              delivery_method: "embedded_fallback",
              shipping_cents: shippingCents,
            },
          });
          if (fbErr) throw fbErr;
          const url = (fallback as any)?.url;
          if (url) {
            window.open(url, "_blank");
            setMounting(false);
            return;
          }
          throw new Error("Hosted checkout unavailable");
        } catch (err: any) {
          toast("Checkout error", { description: (e?.message || String(e)) + (err?.message ? ` — Fallback: ${err.message}` : "") });
          setMounting(false);
        }
      }
    })();
  }, [cart.items.length]);

  // Cleanup on unmount: destroy embedded checkout instance
  useEffect(() => {
    return () => {
      try { checkoutRef.current?.destroy?.(); } catch {}
      checkoutRef.current = null;
      initOnceRef.current = false;
    };
  }, []);

  const fmt = (cents: number) =>
    new Intl.NumberFormat((cart.currency || "USD").toUpperCase() === "MYR" ? "ms-MY" : "en-US", {
      style: "currency",
      currency: (cart.currency || "USD").toUpperCase(),
    }).format((cents || 0) / 100);

  return (
    <main className="container py-6 md:py-12 px-4">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h1 className="text-2xl md:text-3xl font-semibold">Secure checkout</h1>
          <p className="mt-2 text-muted-foreground text-sm md:text-base">Complete your payment without leaving CoopMarket.</p>

<Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div ref={containerRef} className="min-h-[600px] w-full rounded-md border" />
                {mounting && (
                  <div className="absolute inset-0 rounded-md overflow-hidden">
                    <Skeleton className="h-full w-full" />
                  </div>
                )}
              </div>
              {mounting && <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">Preparing checkout…</p>}
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {cart.items.map((it) => (
                  <div key={it.product_id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded border overflow-hidden bg-muted">
                      <img
                        src={productImages[it.product_id] || "/placeholder.svg"}
                        alt={`${it.name} image`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-sm line-clamp-1">{it.name}</div>
                    <div className="ml-auto text-xs text-muted-foreground">x{it.quantity}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Items</span><span className="font-medium">{cart.count}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{fmt(cart.subtotal_cents)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="font-semibold">{shippingCents ? fmt(shippingCents) : "—"}</span></div>
              <div className="border-t pt-3 flex items-center justify-between"><span className="font-medium">Total</span><span className="text-lg md:text-xl font-semibold">{fmt(totalCents)}</span></div>
              <Button variant="ghost" onClick={() => navigate("/cart")} className="w-full mt-2">Back to cart</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
