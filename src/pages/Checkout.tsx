import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

export default function Checkout() {
  const cart = useCart();
  const location = useLocation();
  const navigate = useNavigate();
const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounting, setMounting] = useState(true);

  useMemo(() => setSEO("Checkout | CoopMarket", "Secure, embedded checkout without leaving the app."), []);

  const shippingCents = (location.state as any)?.shippingCents ?? 0;
  const totalCents = cart.subtotal_cents + shippingCents;

  useEffect(() => {
    (async () => {
      if (cart.items.length === 0) {
        navigate("/cart");
        return;
      }
      try {
        const { data: cfg, error: cfgErr } = await supabase.functions.invoke("stripe-config");
        if (cfgErr) throw cfgErr;
        const pk = (cfg as any)?.publishableKey;
        if (!pk) throw new Error("Stripe publishable key missing");

        const stripe = await loadStripe(pk);
        if (!stripe) throw new Error("Failed to load Stripe.js");

const { data, error } = await supabase.functions.invoke("create-embedded-checkout", {
          body: {
            name: `Cart purchase (${cart.count} item${cart.count > 1 ? "s" : ""})`,
            amount_cents: totalCents,
            currency: cart.currency,
            success_path: "/payment-success",
            vendor_id: cart.vendor_id,
            community_id: cart.community_id,
            product_id: cart.items[0]?.product_id,
            delivery_method: "rider",
          },
        });
        if (error) throw error;
        const clientSecret = (data as any)?.client_secret;
        if (!clientSecret) throw new Error("No client_secret returned");

        const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
        if (containerRef.current) checkout.mount(containerRef.current);
        setMounting(false);
      } catch (e: any) {
        toast("Checkout error", { description: e.message || String(e) });
        setMounting(false);
      }
    })();
  }, [cart.items.length]);

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
              <div ref={containerRef} className="min-h-[600px] w-full rounded-md border" />
              {mounting && <p className="mt-3 text-sm text-muted-foreground">Preparing checkout…</p>}
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
