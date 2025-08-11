import { useEffect, useMemo, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { usePayoutProfile, formatPayoutDetails } from "@/hooks/usePayoutProfile";
import { usePayoutSettings } from "@/hooks/usePayoutSettings";

interface Vendor { id: string; display_name: string }
interface PayoutRow {
  id: string;
  created_at: string;
  status: string;
  amount_cents: number;
  currency: string;
  method: string;
  reference: string | null;
  notes: string | null;
}

const fmt = (cents: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "MYR").toUpperCase() }).format((cents || 0) / 100);
  } catch {
    return `${(cents || 0) / 100} ${(currency || "MYR").toUpperCase()}`;
  }
};

export default function VendorPayouts() {
  const { user, loading } = useAuthRoles();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [balances, setBalances] = useState<{ available_cents: number; pending_cents: number; paid_cents: number; total_earned_cents: number; currency: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { profile, loading: payoutLoading } = usePayoutProfile();
  const { getMinPayoutCents } = usePayoutSettings();
  const MIN_PAYOUT_CENTS = getMinPayoutCents("vendor");

  useEffect(() => {
    setSEO("Vendor Payouts — CoopMarket", "Request payouts and see your available balance.");
  }, []);

  useEffect(() => {
    if (!notes && profile) {
      const auto = formatPayoutDetails(profile);
      if (auto) setNotes(auto);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && user) {
      loadAll();
      
      // Set up realtime subscription for payout updates
      const payoutChannel = supabase
        .channel('vendor-payout-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'payouts'
        }, () => {
          loadAll();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(payoutChannel);
      };
    }
  }, [loading, user]);

  const loadAll = async () => {
    try {
      setLoadingData(true);
      // Vendor profile
      const { data: vRow, error: vErr } = await supabase.from("vendors").select("id,display_name").eq("user_id", user!.id).maybeSingle();
      if (vErr) throw vErr;
      if (!vRow) {
        toast("No vendor account", { description: "Create a vendor profile first." });
        return;
      }
      setVendor(vRow);

      // Balances via edge function
      const { data: bal, error: balErr } = await supabase.functions.invoke("vendor-balance");
      if (balErr) throw balErr;
      setBalances(bal as any);

      // Payout history
      const { data: pRows, error: pErr } = await supabase
        .from("payouts")
        .select("id,created_at,status,amount_cents,currency,method,reference,notes")
        .eq("vendor_id", vRow.id)
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      setPayouts((pRows as any[]) || []);
    } catch (e: any) {
      toast("Failed to load", { description: e.message || String(e) });
    } finally {
      setLoadingData(false);
    }
  };

  const canRequest = useMemo(() => {
    if (!balances) return false;
    const requestedCents = Math.round(Number(amount) * 100);
    return requestedCents > 0 && requestedCents <= (balances?.available_cents || 0) && requestedCents >= MIN_PAYOUT_CENTS;
  }, [balances, amount]);

  const submit = async () => {
    if (!vendor || !balances) return;
    const requestedCents = Math.round(Number(amount) * 100);
    if (!requestedCents || requestedCents <= 0) {
      toast("Enter amount", { description: "Please enter a valid amount." });
      return;
    }
    if (requestedCents > balances.available_cents) {
      toast("Too high", { description: "Amount exceeds available balance." });
      return;
    }
    if (requestedCents < MIN_PAYOUT_CENTS) {
      toast("Below minimum", { description: `Minimum request is ${fmt(MIN_PAYOUT_CENTS, balances.currency || "MYR")}.` });
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.from("payouts").insert({
        vendor_id: vendor.id,
        requested_by: user!.id,
        amount_cents: requestedCents,
        currency: (balances.currency || "MYR").toLowerCase(),
        method: "manual",
        notes: notes || null,
      });
      if (error) throw error;
      toast("Request sent", { description: "Your payout request was submitted." });
      setAmount(0);
      setNotes("");
      await loadAll();
    } catch (e: any) {
      toast("Couldn't submit", { description: e.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id: string) => {
    if (!confirm("Cancel this payout request?")) return;
    try {
      const { error } = await supabase.from("payouts").delete().eq("id", id);
      if (error) throw error;
      toast("Canceled", { description: "Your payout request was canceled." });
      await loadAll();
    } catch (e: any) {
      toast("Failed to cancel", { description: e.message || String(e) });
    }
  };

  if (loading || loadingData) {
    return <main className="container py-10">Loading…</main>;
  }
  if (!user || !vendor) {
    return <main className="container py-10">Sign in as a vendor to view this page.</main>;
  }

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-sm text-muted-foreground">Request withdrawals and track payment status.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle>Available</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {fmt(balances?.available_cents || 0, balances?.currency || "MYR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {fmt(balances?.pending_cents || 0, balances?.currency || "MYR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Paid To Date</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {fmt(balances?.paid_cents || 0, balances?.currency || "MYR")}
          </CardContent>
        </Card>
      </section>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <Input type="number" min={0} step="0.01" value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                placeholder="0.00" />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setAmount(Number((((balances?.available_cents||0)/100)*0.25).toFixed(2)))}>25%</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setAmount(Number((((balances?.available_cents||0)/100)*0.5).toFixed(2)))}>50%</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setAmount(Number((((balances?.available_cents||0)/100)*0.75).toFixed(2)))}>75%</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setAmount(Number((((balances?.available_cents||0)/100)*1).toFixed(2)))}>Max</Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Max: {fmt(balances?.available_cents || 0, balances?.currency || "MYR")} · Min: {fmt(MIN_PAYOUT_CENTS, balances?.currency || "MYR")}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Payout destination</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={formatPayoutDetails(profile) || "e.g., Bank XYZ, Acc 1234"} />
              <div className="text-xs text-muted-foreground mt-1">
                {formatPayoutDetails(profile) ? (
                  <>Using saved details · <Link to="/vendor/settings" className="underline">Edit payout details</Link></>
                ) : (
                  <>No saved payout details · <Link to="/vendor/settings" className="underline">Add in Settings</Link></>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={submit} disabled={!canRequest || submitting} variant="hero">
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{p.status}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell className="text-xs">{p.reference || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(p.amount_cents, p.currency)}</TableCell>
                      <TableCell className="text-right">
                        {p.status === "requested" && (
                          <Button size="sm" variant="outline" onClick={() => cancelRequest(p.id)}>Cancel</Button>
                        )}
                      </TableCell>
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
}
