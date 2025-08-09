import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface KycRow {
  user_id: string;
  status: string;
  front_id_path: string | null;
  back_id_path: string | null;
  selfie_path: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminKYC() {
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kyc_profiles")
        .select("user_id,status,front_id_path,back_id_path,selfie_path,notes,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as any[]) || []);
    } catch (e: any) {
      toast("Failed to load KYC submissions", { description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const link = async (path: string | null) => {
    if (!path) return undefined;
    const { data } = await supabase.storage.from("kyc-docs").createSignedUrl(path, 300);
    return data?.signedUrl;
  };

  const approve = async (row: KycRow) => {
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      const { error } = await supabase
        .from("kyc_profiles")
        .update({ status: "approved", reviewed_by: uid ?? null, reviewed_at: new Date().toISOString(), notes: row.notes || null })
        .eq("user_id", row.user_id);
      if (error) throw error;
      toast.success("Approved");
      load();
    } catch (e: any) {
      toast("Failed to approve", { description: e.message || String(e) });
    }
  };

  const reject = async (row: KycRow) => {
    const reason = window.prompt("Add a rejection reason (optional):", row.notes || "");
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      const { error } = await supabase
        .from("kyc_profiles")
        .update({ status: "rejected", reviewed_by: uid ?? null, reviewed_at: new Date().toISOString(), notes: (reason || null) })
        .eq("user_id", row.user_id);
      if (error) throw error;
      toast("Marked as rejected");
      load();
    } catch (e: any) {
      toast("Failed to reject", { description: e.message || String(e) });
    }
  };

  return (
    <main className="container py-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>KYC Submissions</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Filter by user id…" className="h-9 max-w-xs" onChange={(e) => {
              const q = e.target.value.trim();
              if (!q) return load();
              setRows((prev) => prev.filter((r) => r.user_id.includes(q)));
            }} />
            <Button size="sm" variant="secondary" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No submissions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>User</TableHead>
                    
                    <TableHead>Status</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={`${r.user_id}-${r.created_at}`}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-mono">{r.user_id.slice(0, 8)}…</TableCell>
                      
                      <TableCell className="capitalize text-sm">{r.status}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => { const u = await link(r.front_id_path); if (u) window.open(u, "_blank"); }} disabled={!r.front_id_path}>Front</Button>
                          <Button size="sm" variant="outline" onClick={async () => { const u = await link(r.back_id_path); if (u) window.open(u, "_blank"); }} disabled={!r.back_id_path}>Back</Button>
                          <Button size="sm" variant="outline" onClick={async () => { const u = await link(r.selfie_path); if (u) window.open(u, "_blank"); }} disabled={!r.selfie_path}>Selfie</Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => reject(r)}>Reject</Button>
                            <Button size="sm" variant="hero" onClick={() => approve(r)}>Approve</Button>
                          </div>
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
