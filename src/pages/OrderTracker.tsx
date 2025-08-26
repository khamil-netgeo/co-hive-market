import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrderProgress } from "@/hooks/useOrderProgress";
import { toast } from "sonner";
import { trackEasyParcel } from "@/lib/shipping";
import LiveRiderMap from "@/components/order/LiveRiderMap";
import OrderChatPanel from "@/components/order/OrderChatPanel";
import MediaGallery from "@/components/common/MediaGallery";

interface OrderMeta {
  id: string;
  created_at: string;
  status: string;
  total_amount_cents: number;
  currency: string;
  shipping_method?: string | null;
  easyparcel_awb_no?: string | null;
  easyparcel_order_no?: string | null;
}

const cents = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() || "USD" }).format((n || 0) / 100);

export default function OrderTracker() {
  const params = useParams();
  const navigate = useNavigate();
  const orderId = params.id || null;
  const { events, loading } = useOrderProgress(orderId);
  const [order, setOrder] = useState<OrderMeta | null>(null);
  const [delivery, setDelivery] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

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
        .select("id, created_at, status, total_amount_cents, currency, shipping_method, easyparcel_awb_no, easyparcel_order_no")
        .eq("id", orderId)
        .maybeSingle();
      if (!error) setOrder(o as any);

      // Load order items with products
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id, quantity, unit_price_cents,
          product_id,
          products (
            id, name, image_urls
          )
        `)
        .eq("order_id", orderId);
      if (!itemsError) {
        setOrderItems(items || []);
      }
    };
    init();
  }, [orderId, navigate]);

  useEffect(() => {
    if (!orderId) return;
    const loadDelivery = async () => {
      const { data: d } = await supabase
        .from('deliveries')
        .select('id,status,rider_user_id,pickup_address,dropoff_address,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng,assigned_at,scheduled_pickup_at,scheduled_dropoff_at')
        .eq('order_id', orderId)
        .maybeSingle();
      if (d) setDelivery(d as any);
    };
    loadDelivery();
    const channel = supabase
      .channel(`delivery-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries', filter: `order_id=eq.${orderId}` },
        (payload) => setDelivery(payload.new as any)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

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
          {order && order.status !== 'fulfilled' && order.status !== 'canceled' && (
            <Button
              onClick={async () => {
                try {
                  if (!orderId) return;
                  const { error: updErr } = await supabase
                    .from('orders')
                    .update({ status: 'fulfilled', buyer_confirmed_at: new Date().toISOString() } as any)
                    .eq('id', orderId);
                  if (updErr) throw updErr;
                  await supabase.from('order_progress_events').insert({
                    order_id: orderId,
                    event: 'buyer_confirmed_received',
                    description: 'Buyer confirmed receiving the goods',
                    metadata: {},
                  });
                  toast.success('Thanks for confirming!');
                  setOrder({ ...(order as any), status: 'fulfilled' });
                } catch (e: any) {
                  toast('Confirmation failed', { description: e.message || String(e) });
                }
              }}
            >
              Confirm Received
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderItems.length > 0 ? (
                orderItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="h-12 w-12 shrink-0">
                      <MediaGallery
                        images={item.products?.image_urls || []}
                        alt={item.products?.name || "Product"}
                        aspect="square"
                        showThumbnails={false}
                        className="h-12 w-12"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products?.name || "Product"}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm text-right">
                      {cents(item.unit_price_cents * item.quantity, order?.currency || "usd")}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Loading items...</p>
              )}
            </CardContent>
          </Card>

          <Card>
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
              {order?.shipping_method === 'easyparcel' && (
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Courier</span>
                    <span className="font-medium">EasyParcel</span>
                  </div>
                  {order?.easyparcel_awb_no && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">AWB</span>
                      <span className="font-mono">{order.easyparcel_awb_no}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const res = await trackEasyParcel({ awb_no: order?.easyparcel_awb_no || order?.easyparcel_order_no });
                        const status = (res as any)?.data?.[0]?.status || (res as any)?.result?.[0]?.status || "Status retrieved";
                        toast("Tracking update", { description: String(status) });
                      } catch (e: any) {
                        toast("Tracking error", { description: e.message || String(e) });
                      }
                    }}
                  >
                    Track shipment
                  </Button>
                </div>
              )}

              {order?.shipping_method === 'rider' && (
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium">Rider</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="secondary">{delivery?.status || 'pending'}</Badge>
                    </div>
                    {delivery?.rider_user_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rider</span>
                        <span className="font-mono">{String(delivery.rider_user_id).slice(0,8)}</span>
                      </div>
                    )}
                    {delivery?.pickup_address && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pickup</span>
                        <span className="truncate max-w-[60%] text-right">{delivery.pickup_address}</span>
                      </div>
                    )}
                    {delivery?.dropoff_address && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Dropoff</span>
                        <span className="truncate max-w-[60%] text-right">{delivery.dropoff_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Live Rider Tracking Map */}
          {order?.shipping_method === 'rider' && delivery && orderId && (
            <LiveRiderMap 
              orderId={orderId}
              delivery={delivery}
              heightClass="h-96"
            />
          )}

          {/* Order Chat */}
          {orderId && (
            <OrderChatPanel orderId={orderId} />
          )}

          {/* Delivery Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading updates…</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No updates yet. We'll notify you when things start moving.</p>
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
      </div>
    </main>
  );
}