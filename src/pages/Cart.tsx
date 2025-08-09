import { useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Cart() {
  const cart = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  useMemo(() => setSEO("Cart | CoopMarket", "Review your items and checkout securely."), []);

  const fmt = (cents: number) =>
    new Intl.NumberFormat((cart.currency || "USD").toUpperCase() === "MYR" ? "ms-MY" : "en-US", {
      style: "currency",
      currency: (cart.currency || "USD").toUpperCase(),
    }).format((cents || 0) / 100);

  const checkout = async () => {
    try {
      if (cart.items.length === 0) return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast("Sign in required", { description: "Create an account to checkout." });
        window.location.href = "/auth";
        return;
      }
      if (!cart.vendor_id || !cart.community_id || !cart.currency) {
        toast("Cart issue", { description: "Invalid cart context. Please clear and try again." });
        return;
      }
      setCheckingOut(true);
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Cart purchase (${cart.count} item${cart.count > 1 ? "s" : ""})`,
          amount_cents: cart.subtotal_cents,
          currency: cart.currency,
          success_path: "/payment-success",
          cancel_path: "/payment-canceled",
          vendor_id: cart.vendor_id,
          community_id: cart.community_id,
        },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.open(url, "_blank");
    } catch (e: any) {
      toast("Unable to checkout", { description: e.message || String(e) });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <main className="container py-12 md:py-16">
      <h1 className="text-3xl font-semibold">Your Cart</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">Items are reserved for a limited time. Complete checkout to confirm.</p>

      {cart.items.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-10 text-center text-muted-foreground">Your cart is empty.</CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {cart.items.map((it) => (
                <div key={it.product_id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-sm text-muted-foreground">{fmt(it.price_cents)} each</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor={`qty-${it.product_id}`} className="sr-only">Quantity</label>
                    <Input
                      id={`qty-${it.product_id}`}
                      type="number"
                      min={1}
                      max={999}
                      className="w-20"
                      value={it.quantity}
                      onChange={(e) => cart.updateQty(it.product_id, Number(e.target.value))}
                    />
                    <Button variant="outline" onClick={() => cart.remove(it.product_id)}>Remove</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{cart.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{fmt(cart.subtotal_cents)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and taxes are calculated at checkout.</p>
              <Button variant="hero" onClick={checkout} disabled={checkingOut}>
                {checkingOut ? "Redirecting…" : "Checkout"}
              </Button>
              <Button variant="ghost" onClick={cart.clear}>Clear cart</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
