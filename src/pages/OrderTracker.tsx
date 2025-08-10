import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrderProgress } from "@/hooks/useOrderProgress";

interface OrderMeta {
  id: string;
  created_at: string;
  status: string;
  total_amount_cents: number;
  currency: string;
}

const cents = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() || "USD" }).format((n || 0) / 100);

export default function OrderTracker() {
  const params = useParams();
  const navigate = useNavigate();
  const orderId = params.id || null;
  const { events, loading } = useOrderProgress(orderId);
  const [order, setOrder] = useState<OrderMeta | null>(null);

  useEffect(() => {
    setSEOAdvanced({
      title: "Track Order — CoopMarket",
      description: "Live delivery timeline and updates for your order.",
      type: "product",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Order",
        orderNumber: orderId,
        orderStatus: order?.status,
        priceCurrency: order?.currency?.toUpperCase?.() || "USD",
        price: (order?.total_amount_cents || 0) / 100,
      },
    });
  }, [orderId, order]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }
      if (!orderId) return;
      const { data: o, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_amount_cents, currency")
        .eq("id", orderId)
        .maybeSingle();
      if (!error) setOrder(o as any);
    };
    init();
  }, [orderId, navigate]);

  const timeline = useMemo(() => {
    return events.map((e) => ({
      id: e.id,
      label: e.description || e.event.replace(/_/g, " "),
      at: new Date(e.created_at).toLocaleString(),
    }));
  }, [events]);

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Track Order</h1>
          <p className="text-sm text-muted-foreground">Live updates for order {orderId?.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <a href="/orders">Back to Orders</a>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono">{order?.id?.slice(0, 10) || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Placed</span>
              <span>{order ? new Date(order.created_at).toLocaleString() : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={order?.status === "completed" ? "default" : order?.status === "canceled" ? "destructive" : "secondary"}>
                {order?.status || "—"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{order ? cents(order.total_amount_cents, order.currency) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading updates…</p>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet. We’ll notify you when things start moving.</p>
            ) : (
              <ol className="relative border-l pl-4">
                {timeline.map((t) => (
                  <li key={t.id} className="mb-6 ml-2">
                    <div className="absolute w-3 h-3 bg-primary rounded-full mt-1.5 -left-1.5 border border-background" />
                    <time className="block text-xs text-muted-foreground">{t.at}</time>
                    <p className="text-sm font-medium mt-1">{t.label}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
