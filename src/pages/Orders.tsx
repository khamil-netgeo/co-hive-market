import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MediaGallery from "@/components/common/MediaGallery";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import OrderCard from "@/components/orders/OrderCard";

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  total_amount_cents: number;
  shipping_cents?: number | null;
  currency: string;
  vendor_id?: string | null;
}



const cents = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() || "USD" }).format((n || 0) / 100);

const Orders = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [orderThumbs, setOrderThumbs] = useState<Record<string, string>>({});
  const [summaries, setSummaries] = useState<Record<string, { title: string; count: number }>>({});
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});
  const [etaMap, setEtaMap] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  useEffect(() => {
    setSEO("My Purchases — CoopMarket", "Track orders, shipments, returns, and refunds");
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/auth";
        return;
      }
      setUserId(data.session.user.id);
    };
    init();
  }, []);

  const { data: orders = [], refetch, isLoading, isError } = useQuery<OrderRow[]>({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_amount_cents, currency, vendor_id")
        .eq("buyer_user_id", userId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("orders-buyer-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `buyer_user_id=eq.${userId}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);
  // Load a thumbnail and summary per order (first product image and name)
  useEffect(() => {
    (async () => {
      try {
        if (!orders || orders.length === 0) {
          setOrderThumbs({});
          setSummaries({});
          return;
        }
        const orderIds = orders.map((o) => o.id);
        const { data: items, error: itemsErr } = await supabase
          .from("order_items")
          .select("order_id,product_id")
          .in("order_id", orderIds);
        if (itemsErr) throw itemsErr;
        const productIds = Array.from(new Set((items || []).map((r: any) => r.product_id))).filter(Boolean);
        if (productIds.length === 0) return;
        const { data: prods, error: prodErr } = await supabase
          .from("products")
          .select("id,name,image_urls")
          .in("id", productIds);
        if (prodErr) throw prodErr;
        const imgByProduct = new Map<string, string>();
        const nameByProduct = new Map<string, string>();
        (prods || []).forEach((p: any) => {
          const u = p?.image_urls?.[0];
          if (u) imgByProduct.set(p.id, u);
          if (p?.name) nameByProduct.set(p.id, p.name);
        });
        const imgMap: Record<string, string> = {};
        const sumMap: Record<string, { title: string; count: number }> = {};
        const byOrder: Record<string, string[]> = {};
        (items || []).forEach((r: any) => {
          if (!imgMap[r.order_id]) {
            const img = imgByProduct.get(r.product_id);
            if (img) imgMap[r.order_id] = img;
          }
          if (!byOrder[r.order_id]) byOrder[r.order_id] = [];
          byOrder[r.order_id].push(r.product_id);
        });
        Object.keys(byOrder).forEach((oid) => {
          const ids = byOrder[oid];
          const firstName = ids.length > 0 ? nameByProduct.get(ids[0]) : undefined;
          sumMap[oid] = { title: firstName || `Order ${oid.slice(0, 8)}`, count: ids.length };
        });
        setOrderThumbs(imgMap);
        setSummaries(sumMap);
      } catch (_) {
        // non-fatal; ignore
      }
    })();
  }, [orders]);

  // Load vendor names for current orders
  useEffect(() => {
    (async () => {
      try {
        if (!orders || orders.length === 0) {
          setVendorMap({});
          return;
        }
        const vendorIds = Array.from(new Set(orders.map((o) => o.vendor_id).filter(Boolean))) as string[];
        if (vendorIds.length === 0) {
          setVendorMap({});
          return;
        }
        const { data, error } = await supabase
          .from("vendors")
          .select("id,name")
          .in("id", vendorIds);
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach((v: any) => {
          if (v?.id) map[v.id] = v?.name || "Vendor";
        });
        setVendorMap(map);
      } catch (_) {
        // ignore non-critical errors
      }
    })();
  }, [orders]);

  // Load delivery ETA/status text for orders
  useEffect(() => {
    (async () => {
      try {
        if (!orders || orders.length === 0) {
          setEtaMap({});
          return;
        }
        const orderIds = orders.map((o) => o.id);
        const { data, error } = await supabase
          .from("deliveries")
          .select("order_id,status,scheduled_dropoff_at,assigned_at")
          .in("order_id", orderIds);
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach((d: any) => {
          const s = (d?.status || "").toLowerCase();
          const dt = d?.scheduled_dropoff_at ? new Date(d.scheduled_dropoff_at) : null;
          if (dt) {
            map[d.order_id] = `ETA ${dt.toLocaleDateString()}`;
          } else if (s === "delivered") {
            map[d.order_id] = "Delivered";
          } else if (s === "picked_up" || s === "out_for_delivery") {
            map[d.order_id] = "Out for delivery";
          } else if (s === "assigned") {
            map[d.order_id] = "Rider assigned";
          }
        });
        setEtaMap(map);
      } catch (_) {
        // ignore non-critical errors
      }
    })();
  }, [orders]);

  // Apply tab + search filters
  const filtered = orders.filter((o) => {
    const s = (o.status || "").toLowerCase();
    let matchesTab = true;
    if (tab === "to_pay") {
      matchesTab = [
        "pending",
        "to_pay",
        "awaiting_payment",
        "payment_pending",
        "created",
        "unpaid",
      ].includes(s);
    } else if (tab === "to_ship") {
      matchesTab = [
        "paid",
        "processing",
        "to_ship",
        "awaiting_shipment",
        "confirmed",
        "packaging",
        "ready_to_ship",
      ].includes(s);
    } else if (tab === "to_receive") {
      matchesTab = [
        "shipped",
        "in_transit",
        "out_for_delivery",
        "to_receive",
      ].includes(s) || (!!etaMap[o.id] && !["fulfilled", "completed", "delivered", "canceled", "cancelled", "refunded", "returned"].includes(s));
    } else if (tab === "completed") {
      matchesTab = ["fulfilled", "completed", "delivered"].includes(s);
    } else if (tab === "returns") {
      matchesTab = [
        "return_requested",
        "refund_requested",
        "refunded",
        "returned",
        "canceled",
        "cancelled",
      ].includes(s);
    }
    if (!matchesTab) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;
    const vendorName = o.vendor_id ? vendorMap[o.vendor_id] : "";
    const title = summaries[o.id]?.title || "";
    return (
      (vendorName || "").toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Purchases</h1>
          <p className="text-sm text-muted-foreground">Track orders, shipments, returns, and refunds.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" asChild className="w-full sm:w-auto">
            <a href="/products">Go to Catalog</a>
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="w-full sm:w-auto">
            Refresh
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">Failed to load orders.</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. Explore the catalog to get started.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
                  <TabsList className="grid grid-cols-3 sm:inline-flex">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="to_pay">To Pay</TabsTrigger>
                    <TabsTrigger value="to_ship">To Ship</TabsTrigger>
                    <TabsTrigger value="to_receive">To Receive</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="returns">Returns</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="w-full sm:w-64">
                  <Input
                    placeholder="Search orders by shop, item, or ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search orders"
                  />
                </div>
              </div>

              <section className="space-y-3">
                {filtered.map((o) => (
                  <OrderCard
                    key={o.id}
                    orderId={o.id}
                    createdAt={o.created_at}
                    status={o.status}
                    totalCents={o.total_amount_cents}
                    currency={o.currency}
                    thumbnailUrl={orderThumbs[o.id]}
                    vendorName={o.vendor_id ? vendorMap[o.vendor_id] : undefined}
                    summaryTitle={summaries[o.id]?.title}
                    itemCount={summaries[o.id]?.count}
                    etaText={etaMap[o.id]}
                    onConfirm={
                      o.status !== "fulfilled" && o.status !== "canceled"
                        ? async () => {
                            try {
                              const { error: updErr } = await supabase
                                .from("orders")
                                .update({ status: "fulfilled", buyer_confirmed_at: new Date().toISOString() } as any)
                                .eq("id", o.id);
                              if (updErr) throw updErr;
                              await supabase.from("order_progress_events").insert({
                                order_id: o.id,
                                event: "buyer_confirmed_received",
                                description: "Buyer confirmed receiving the goods",
                                metadata: {},
                              });
                              toast.success("Thanks for confirming!");
                              refetch();
                            } catch (e: any) {
                              toast("Confirmation failed", { description: e.message || String(e) });
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Orders;
