import { useEffect, useMemo, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import RiderNavigation from "@/components/rider/RiderNavigation";
import { Link } from "react-router-dom";

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

export default function RiderPayouts() {
  const { user, loading } = useAuthRoles();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [balances, setBalances] = useState<{ available_cents: number; pending_cents: number; paid_cents: number; total_earned_cents: number; currency: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSEO("Rider Payouts — CoopMarket", "Request payouts and view your rider earnings.");
  }, []);

  useEffect(() => {
    if (!loading && user) loadAll();
  }, [loading, user]);

  const loadAll = async () => {
    try {
      setLoadingData(true);
      // Balances via edge function
      const { data: bal, error: balErr } = await supabase.functions.invoke("rider-balance");
      if (balErr) throw balErr;
      setBalances(bal as any);

      // Payout history
      const { data: pRows, error: pErr } = await supabase
        .from("rider_payouts")
        .select("id,created_at,status,amount_cents,currency,method,reference,notes")
        .eq("rider_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      setPayouts((pRows as any[]) || []);
    } catch (e: any) {
      toast("Failed to load", { description: e.message || String(e) });
    } finally {
      setLoadingData(false);
    }
  };

  const canRequest = useMemo(() => !!balances && balances.available_cents > 0, [balances]);

  const submit = async () => {
    if (!user || !balances) return;
    const requestedCents = Math.round(Number(amount) * 100);
    if (!requestedCents || requestedCents <= 0) {
      toast("Enter amount", { description: "Please enter a valid amount." });
      return;
    }
    if (requestedCents > balances.available_cents) {
      toast("Too high", { description: "Amount exceeds available balance." });
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.from("rider_payouts").insert({
        rider_user_id: user!.id,
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
      const { error } = await supabase.from("rider_payouts").delete().eq("id", id);
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
  if (!user) {
    return (
      <main className="container py-10">
        <div className="flex flex-col items-start gap-3 rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            Sign in as a rider to view this page.
          </p>
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Rider Payouts</h1>
          <p className="mt-2 text-muted-foreground">
            Request withdrawals and track payment status.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <RiderNavigation />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
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

            <Card>
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
                    <div className="text-xs text-muted-foreground mt-1">Max: {fmt(balances?.available_cents || 0, balances?.currency || "MYR")}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Notes (bank details or instructions)</label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Bank XYZ, Acc 1234" />
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
          </div>
        </div>
      </section>
    </main>
  );
}