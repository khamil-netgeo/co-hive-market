import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LedgerEntry {
  id: string;
  created_at: string;
  entry_type: "vendor_payout" | "community_share" | "coop_share" | string;
  beneficiary_type: "vendor" | "community" | "coop" | string;
  beneficiary_id: string | null;
  order_id: string;
  amount_cents: number;
  notes: string | null;
}

interface Vendor { id: string; display_name: string }
interface Community { id: string; name: string }
interface OrderInfo { id: string; currency: string }

const fmtCurrency = (cents: number, currency?: string) => {
  const amount = (cents || 0) / 100;
  const code = (currency || "MYR").toUpperCase();
  const locale = code === "MYR" ? "ms-MY" : code === "USD" ? "en-US" : undefined;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
};

const Finance = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});
  const [communities, setCommunities] = useState<Record<string, Community>>({});
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data: eData, error: eErr } = await supabase
        .from("ledger_entries")
        .select("id, created_at, entry_type, beneficiary_type, beneficiary_id, order_id, amount_cents, notes")
        .order("created_at", { ascending: false })
        .limit(100);
      if (eErr) throw eErr;
      const list = (eData as any[]) as LedgerEntry[];
      setEntries(list);

      const vendorIds = Array.from(new Set(list.filter(e => e.beneficiary_type === "vendor" && e.beneficiary_id).map(e => e.beneficiary_id!)));
      const communityIds = Array.from(new Set(list.filter(e => e.beneficiary_type === "community" && e.beneficiary_id).map(e => e.beneficiary_id!)));
      const orderIds = Array.from(new Set(list.map(e => e.order_id)));

      const [vRes, cRes, oRes] = await Promise.all([
        vendorIds.length ? supabase.from("vendors").select("id,display_name").in("id", vendorIds) : Promise.resolve({ data: [], error: null } as any),
        communityIds.length ? supabase.from("communities").select("id,name").in("id", communityIds) : Promise.resolve({ data: [], error: null } as any),
        orderIds.length ? supabase.from("orders").select("id,currency").in("id", orderIds) : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (vRes.error) throw vRes.error;
      if (cRes.error) throw cRes.error;
      if (oRes.error) throw oRes.error;

      const vMap: Record<string, Vendor> = {};
      (vRes.data as any[]).forEach(v => (vMap[v.id] = v));
      setVendors(vMap);

      const cMap: Record<string, Community> = {};
      (cRes.data as any[]).forEach(c => (cMap[c.id] = c));
      setCommunities(cMap);

      const oMap: Record<string, OrderInfo> = {};
      (oRes.data as any[]).forEach(o => (oMap[o.id] = o));
      setOrders(oMap);
    } catch (e: any) {
      toast("Failed to load finance data", { description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSEO(
      "Admin Finance — CoopMarket",
      "Admin view for ledger entries and revenue splits on CoopMarket."
    );
    load();
  }, []);

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        if (e.entry_type === "vendor_payout") acc.vendor += e.amount_cents;
        else if (e.entry_type === "community_share") acc.community += e.amount_cents;
        else if (e.entry_type === "coop_share") acc.coop += e.amount_cents;
        acc.all += e.amount_cents;
        return acc;
      },
      { vendor: 0, community: 0, coop: 0, all: 0 }
    );
  }, [entries]);

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent ledger entries and totals. Only visible to admins.</p>
      </header>

      <section className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Vendor Payouts</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(totals.vendor, Object.values(orders)[0]?.currency || "MYR")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Community Share</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(totals.community, Object.values(orders)[0]?.currency || "MYR")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Coop Share</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(totals.coop, Object.values(orders)[0]?.currency || "MYR")}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Ledger Entries</CardTitle>
            <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">No entries yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => {
                      const order = orders[e.order_id];
                      const currency = order?.currency || "MYR";
                      const beneLabel =
                        e.beneficiary_type === "vendor"
                          ? vendors[e.beneficiary_id || ""]?.display_name || `Vendor ${e.beneficiary_id?.slice(0, 6)}`
                          : e.beneficiary_type === "community"
                          ? communities[e.beneficiary_id || ""]?.name || `Community ${e.beneficiary_id?.slice(0, 6)}`
                          : "Coop";
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(e.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{e.order_id.slice(0, 8)}…</TableCell>
                          <TableCell className="capitalize text-sm">{e.entry_type.replace("_", " ")}</TableCell>
                          <TableCell className="text-sm">{beneLabel}</TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(e.amount_cents, currency)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Finance;
