import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CancelRow {
  id: string;
  order_id: string;
  status: string;
  reason?: string | null;
  created_at: string;
}

export default function VendorCancellationRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CancelRow[]>([]);

  useEffect(() => {
    setSEOAdvanced({
      title: "Cancellation Requests — Vendor",
      description: "Manage customer order cancellation requests.",
      type: "article",
      canonical: window.location.href,
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) { navigate("/auth"); return; }
        const { data: vendors, error } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", session.session.user.id);
        if (error) throw error;
        const ids = (vendors || []).map((v: any) => v.id);
        if (ids.length === 0) { setRows([]); setLoading(false); return; }
        const { data: list, error: qErr } = await supabase
          .from("order_cancel_requests")
          .select("id, order_id, status, reason, created_at")
          .in("vendor_id", ids)
          .order("created_at", { ascending: false });
        if (qErr) throw qErr;
        setRows((list as any[]) || []);
      } catch (e: any) {
        toast("Failed to load requests", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const onUpdate = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("order_cancel_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Request ${status}`);
    } catch (e: any) {
      toast("Update failed", { description: e.message || String(e) });
    }
  };

  const statusVariant = (s: string) => (s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary");

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cancellation Requests</h1>
          <p className="text-sm text-muted-foreground">Review and decide order cancellations.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/vendor/orders")}>Back to Orders</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Order</span>
                      <span className="font-mono text-sm">{r.order_id.slice(0,8)}</span>
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </div>
                    {r.reason && <p className="text-sm text-muted-foreground max-w-prose">{r.reason}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onUpdate(r.id, "rejected")}>Reject</Button>
                    <Button size="sm" onClick={() => onUpdate(r.id, "approved")}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
