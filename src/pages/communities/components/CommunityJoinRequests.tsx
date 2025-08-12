import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JoinRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
}

export default function CommunityJoinRequests({ communityId }: { communityId: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JoinRequest[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("community_join_requests")
        .select("id,user_id,message,status,created_at")
        .eq("community_id", communityId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setRows((data as any[]) || []);
    } catch (e: any) {
      toast("Failed to load join requests", { description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!communityId) return;
    load();
  }, [communityId]);

  const act = async (id: string, action: "approved" | "rejected") => {
    try {
      const { error } = await (supabase as any)
        .from("community_join_requests")
        .update({ status: action, decided_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Request ${action}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      toast("Action failed", { description: e?.message || String(e) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Requests</CardTitle>
        <CardDescription>Approve or reject pending membership requests</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                    <TableCell className="max-w-[22rem] truncate" title={r.message || undefined}>{r.message}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => act(r.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")}>Reject</Button>
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
  );
}
