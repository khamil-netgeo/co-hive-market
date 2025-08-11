import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Eye } from "lucide-react";
import PayoutProofUploader from "@/components/payout/PayoutProofUploader";
import { formatPayoutDetails } from "@/hooks/usePayoutProfile";

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
interface Payout {
  id: string;
  created_at: string;
  status: string;
  amount_cents: number;
  currency: string;
  vendor_id?: string;
  method: string;
  reference: string | null;
  notes: string | null;
  proof_path?: string | null;
  rider_user_id?: string;
}

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
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [riderPayouts, setRiderPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [userPayoutProfiles, setUserPayoutProfiles] = useState<Record<string, any>>({});

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

  const approvePayout = async (p: Payout) => {
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      const table = p.vendor_id ? "payouts" : "rider_payouts";
      const { error } = await supabase
        .from(table)
        .update({ status: "approved", approved_by: uid ?? null, approved_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
      toast("Payout approved");
      await Promise.all([loadPayouts(), loadRiderPayouts()]);
    } catch (e: any) {
      toast("Failed to approve", { description: e.message || String(e) });
    }
  };

  const markPaid = async (p: Payout) => {
    const ref = window.prompt("Enter payment reference / bank TXN ID (required):");
    if (!ref || !ref.trim()) return;
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      const table = p.vendor_id ? "payouts" : "rider_payouts";
      const { error } = await supabase
        .from(table)
        .update({ status: "paid", paid_by: uid ?? null, paid_at: new Date().toISOString(), reference: ref.trim() })
        .eq("id", p.id);
      if (error) throw error;
      toast("Payout marked as paid");
      await Promise.all([loadPayouts(), loadRiderPayouts()]);
    } catch (e: any) {
      toast("Failed to mark paid", { description: e.message || String(e) });
    }
  };
  const loadPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const { data, error } = await supabase
        .from("payouts")
        .select("id,created_at,status,amount_cents,currency,vendor_id,method,reference,notes,proof_path")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const list = (data as any[]) as Payout[];
      setPayouts(list);

      // Ensure vendor names are available
      const vIds = Array.from(new Set(list.filter(p => p.vendor_id).map(p => p.vendor_id!)));
      const missing = vIds.filter(id => !vendors[id]);
      if (missing.length) {
        const { data: vRows, error: vErr } = await supabase.from("vendors").select("id,display_name").in("id", missing);
        if (vErr) throw vErr;
        const vMap = { ...vendors } as Record<string, Vendor>;
        (vRows as any[]).forEach(v => (vMap[v.id] = v));
        setVendors(vMap);
      }
    } catch (e: any) {
      toast("Failed to load payouts", { description: e.message || String(e) });
    } finally {
      setPayoutsLoading(false);
    }
  };

  const loadRiderPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const { data, error } = await supabase
        .from("rider_payouts")
        .select("id,created_at,status,amount_cents,currency,method,reference,notes,rider_user_id,proof_path")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const list = (data as any[]) as Payout[];
      setRiderPayouts(list);

      // Load payout profiles for both vendor and rider payouts
      await loadPayoutProfiles([...payouts, ...list]);
    } catch (e: any) {
      toast("Failed to load rider payouts", { description: e.message || String(e) });
    } finally {
      setPayoutsLoading(false);
    }
  };

  const loadPayoutProfiles = async (allPayouts: Payout[]) => {
    try {
      const userIds = Array.from(new Set([
        ...allPayouts.filter(p => p.vendor_id).map(p => {
          const vendor = Object.values(vendors).find(v => v.id === p.vendor_id);
          return vendor ? null : p.vendor_id; // We need vendor's user_id, not vendor_id
        }).filter(Boolean),
        ...allPayouts.filter(p => p.rider_user_id).map(p => p.rider_user_id)
      ].filter(Boolean) as string[]));

      // Get vendor user_ids
      const vendorIds = allPayouts.filter(p => p.vendor_id).map(p => p.vendor_id!);
      if (vendorIds.length > 0) {
        const { data: vendorUsers } = await supabase
          .from("vendors")
          .select("id, user_id")
          .in("id", vendorIds);
        if (vendorUsers) {
          userIds.push(...vendorUsers.map(v => v.user_id));
        }
      }

      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from("user_payout_profiles")
        .select("*")
        .in("user_id", userIds);

      if (profiles) {
        const profileMap: Record<string, any> = {};
        profiles.forEach(profile => {
          profileMap[profile.user_id] = profile;
        });
        setUserPayoutProfiles(profileMap);
      }
    } catch (error) {
      console.error("Failed to load payout profiles:", error);
    }
  };

  const exportToCSV = (type: "vendor" | "rider") => {
    const data = type === "vendor" ? payouts : riderPayouts;
    if (data.length === 0) {
      toast("No data to export");
      return;
    }

    const headers = [
      "Date", "ID", type === "vendor" ? "Vendor" : "Rider", 
      "Status", "Amount", "Currency", "Method", "Reference", "Notes"
    ];
    
    const rows = data.map(p => [
      new Date(p.created_at).toLocaleDateString(),
      p.id,
      type === "vendor" 
        ? (p.vendor_id ? (vendors[p.vendor_id]?.display_name || p.vendor_id) : "—")
        : (p.rider_user_id?.slice(0, 8) + "…" || "—"),
      p.status,
      (p.amount_cents / 100).toFixed(2),
      p.currency.toUpperCase(),
      p.method,
      p.reference || "",
      p.notes || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-payouts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${type === "vendor" ? "Vendor" : "Rider"} payouts exported to CSV`);
  };

  const updatePayoutProof = async (payoutId: string, proofPath: string, isRider = false) => {
    try {
      const table = isRider ? "rider_payouts" : "payouts";
      const { error } = await supabase
        .from(table)
        .update({ proof_path: proofPath })
        .eq("id", payoutId);
      
      if (error) throw error;
      
      // Reload the specific payout list
      if (isRider) {
        await loadRiderPayouts();
      } else {
        await loadPayouts();
      }
    } catch (error: any) {
      toast.error("Failed to update proof", { description: error.message });
    }
  };

  const getUserPayoutDetails = (userId: string) => {
    const profile = userPayoutProfiles[userId];
    return profile ? formatPayoutDetails(profile) : null;
  };

  useEffect(() => {
    setSEO(
      "Admin Finance — CoopMarket",
      "Admin view for ledger entries and revenue splits on CoopMarket."
    );
    load();
    loadPayouts();
    loadRiderPayouts();

    // Set up realtime subscriptions for payout updates
    const payoutChannel = supabase
      .channel('payout-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payouts'
      }, () => {
        loadPayouts();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rider_payouts'
      }, () => {
        loadRiderPayouts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(payoutChannel);
    };
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
            <CardTitle>Vendor Payout Requests</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportToCSV("vendor")}>
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={loadPayouts} disabled={payoutsLoading}>
                {payoutsLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No payout requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Payout Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => {
                      const vendorUserIds = Object.entries(vendors).find(([vId]) => vId === p.vendor_id)?.[1];
                      const vendorUserId = vendorUserIds ? Object.values(vendors).find(v => v.id === p.vendor_id)?.id : null;
                      
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{p.vendor_id ? (vendors[p.vendor_id]?.display_name || p.vendor_id.slice(0, 6) + "…") : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                            {p.notes || "No details provided"}
                          </TableCell>
                          <TableCell className="capitalize text-sm">{p.status}</TableCell>
                          <TableCell className="text-sm">{p.method}</TableCell>
                          <TableCell className="text-xs">{p.reference || "—"}</TableCell>
                          <TableCell>
                            {p.status === "approved" || p.status === "paid" ? (
                              <PayoutProofUploader
                                payoutId={p.id}
                                currentProofPath={p.proof_path}
                                onUploadComplete={(path) => updatePayoutProof(p.id, path, false)}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(p.amount_cents, p.currency)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1">
                              {p.status === "requested" && (
                                <Button size="sm" variant="outline" onClick={() => approvePayout(p)}>
                                  Approve
                                </Button>
                              )}
                              {p.status === "approved" && (
                                <Button size="sm" variant="hero" onClick={() => markPaid(p)}>
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rider Payout Requests</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportToCSV("rider")}>
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={loadRiderPayouts} disabled={payoutsLoading}>
                {payoutsLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {riderPayouts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No rider payout requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Payout Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riderPayouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{p.rider_user_id?.slice(0, 8)}…</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                          {p.notes || getUserPayoutDetails(p.rider_user_id!) || "No details provided"}
                        </TableCell>
                        <TableCell className="capitalize text-sm">{p.status}</TableCell>
                        <TableCell className="text-sm">{p.method}</TableCell>
                        <TableCell className="text-xs">{p.reference || "—"}</TableCell>
                        <TableCell>
                          {p.status === "approved" || p.status === "paid" ? (
                            <PayoutProofUploader
                              payoutId={p.id}
                              currentProofPath={p.proof_path}
                              onUploadComplete={(path) => updatePayoutProof(p.id, path, true)}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtCurrency(p.amount_cents)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1">
                            {p.status === "requested" && (
                              <Button size="sm" variant="outline" onClick={() => approvePayout(p)}>
                                Approve
                              </Button>
                            )}
                            {p.status === "approved" && (
                              <Button size="sm" variant="hero" onClick={() => markPaid(p)}>
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

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
                          : e.beneficiary_type === "coop"
                          ? "Coop"
                          : "Rider";
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
