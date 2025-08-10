import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useOrderProgress } from "@/hooks/useOrderProgress";
import { Calendar, Package, User, MapPin, MessageSquare } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  products: { id: string; name: string } | null;
};

type Order = {
  id: string;
  created_at: string;
  status: "pending" | "paid" | "canceled" | "fulfilled" | "refunded";
  total_amount_cents: number;
  currency: string;
  buyer_user_id: string;
  vendor_id: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  ship_address_line1: string | null;
  ship_address_line2: string | null;
  ship_city: string | null;
  ship_state: string | null;
  ship_postcode: string | null;
  ship_country: string | null;
  shipping_method: string | null;
  order_items: OrderItem[];
};

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { events, loading: eventsLoading } = useOrderProgress(orderId || null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `id, created_at, status, total_amount_cents, currency, buyer_user_id, vendor_id,
             recipient_name, recipient_phone, ship_address_line1, ship_address_line2, ship_city, ship_state, ship_postcode, ship_country, shipping_method,
             order_items ( id, quantity, unit_price_cents, products ( id, name ) )`
          )
          .eq("id", orderId)
          .maybeSingle();
        if (error) throw error;
        setOrder((data as any) || null);
      } catch (e) {
        console.error("Failed to load order", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const shortId = useMemo(() => (orderId ? orderId.slice(0, 8) : ""), [orderId]);

  useEffect(() => {
    setSEOAdvanced({
      title: `Order ${shortId} • Vendor` ,
      description: "View order details, items, shipping and updates.",
      type: "website",
      jsonLd: order ? {
        "@context": "https://schema.org",
        "@type": "Order",
        orderNumber: order.id,
        orderStatus: order.status,
        priceCurrency: order.currency,
        price: (order.total_amount_cents / 100).toFixed(2)
      } : null,
    });
  }, [shortId, order]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Order not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Vendor", href: "/vendor/dashboard" },
          { label: "Orders", href: "/vendor/orders" },
          { label: `Order ${shortId}` },
        ]}
        className="mb-4"
      />

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Order {shortId}</h1>
        <p className="text-muted-foreground mt-1">Detailed order and item information</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm break-all">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placed</p>
                <p className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1" variant={order.status === 'fulfilled' ? 'default' : order.status === 'paid' ? 'outline' : order.status === 'pending' ? 'secondary' : order.status === 'canceled' ? 'destructive' : 'secondary'}>
                  {order.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold">{formatPrice(order.total_amount_cents, order.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-medium">{order.recipient_name || '—'}</p>
                  <p className="text-sm text-muted-foreground">{order.recipient_phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {[order.ship_address_line1, order.ship_address_line2].filter(Boolean).join(", ") || '—'}
                  </p>
                  <p className="text-sm">
                    {[order.ship_city, order.ship_state, order.ship_postcode].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-sm">{order.ship_country || ''}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="text-sm capitalize">{order.shipping_method || '—'}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/chat?vendorId=${order.vendor_id}&buyerUserId=${order.buyer_user_id}`}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Message buyer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {order.order_items?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          {it.products?.id ? (
                            <Link className="underline underline-offset-2" to={`/product/${it.products.id}`}>
                              {it.products.name}
                            </Link>
                          ) : (
                            <span>{it.products?.name || 'Product'}</span>
                          )}
                        </TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{formatPrice(it.unit_price_cents, order.currency)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(it.unit_price_cents * it.quantity, order.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order updates</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <p className="text-sm text-muted-foreground">Loading timeline…</p>
            ) : events.length ? (
              <ul className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="border rounded-md p-3">
                    <p className="text-sm font-medium">{e.event}</p>
                    {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(e.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
