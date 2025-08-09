import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  total_amount_cents: number;
  currency: string;
}

const cents = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() || "USD" }).format((n || 0) / 100);

const Orders = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setSEO("My Orders — CoopMarket", "View your recent marketplace orders");
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
        .select("id, created_at, status, total_amount_cents, currency")
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

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <p className="text-sm text-muted-foreground">Recent purchases and their status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <a href="/catalog">Go to Catalog</a>
          </Button>
          <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs sm:text-sm">{o.id.slice(0, 8)}</TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={o.status === "completed" ? "default" : o.status === "canceled" ? "destructive" : "secondary"}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{cents(o.total_amount_cents, o.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Orders;
