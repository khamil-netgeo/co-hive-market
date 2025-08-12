import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface PaymentRow {
  id: string;
  amount_cents: number;
  paid_at: string;
  created_at: string;
  user_id: string;
  currency: string;
  stripe_session_id?: string | null;
}

export default function CommunityMembershipPayments({ communityId }: { communityId: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PaymentRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!communityId) return;
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("community_membership_payments")
          .select("id, amount_cents, paid_at, created_at, user_id, currency, stripe_session_id")
          .eq("community_id", communityId)
          .order("paid_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        setRows(((data as any[]) || []) as any);
      } catch (e) {
        // no toast on subcomponent to keep it lightweight
        console.error("Failed to load membership payments", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [communityId]);

  const exportCsv = () => {
    const header = ["date","amount_rm","user_id","currency","stripe_session_id"].join(",");
    const lines = rows.map(r => {
      const cells = [
        new Date(r.paid_at || r.created_at).toISOString(),
        (r.amount_cents/100).toFixed(2),
        r.user_id || "",
        (r.currency || "myr").toUpperCase(),
        r.stripe_session_id || ""
      ];
      return cells.map(c => `"${String(c).replace(/\"/g,'""')}"`).join(",");
    });
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community_memberships_${communityId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Membership Payments</CardTitle>
          <CardDescription>Latest 20 payments</CardDescription>
        </div>
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No membership payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount (RM)</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{new Date(r.paid_at || r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{(r.amount_cents/100).toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                    <TableCell>{(r.currency || 'myr').toUpperCase()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
