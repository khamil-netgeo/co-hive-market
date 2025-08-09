import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminKYCRequirements() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<"buyer" | "vendor" | "rider" | "admin">("rider");
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"file" | "text" | "number" | "date">("file");
  const [required, setRequired] = useState(true);
  const [enabled, setEnabled] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [{ data: r, error: rErr }, { data: s, error: sErr }] = await Promise.all([
        supabase.from("kyc_requirements").select("*").order("created_at", { ascending: false }),
        supabase.from("kyc_requirement_submissions").select("id,requirement_id,user_id,status,notes,value_text,file_path,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      if (rErr) throw rErr;
      if (sErr) throw sErr;
      setRequirements(r || []);
      setSubs(s || []);
    } catch (e: any) {
      toast("Failed to load", { description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addRequirement = async () => {
    try {
      if (!key.trim() || !label.trim()) return toast("Key and label are required");
      const { error } = await supabase.from("kyc_requirements").insert({ role, key: key.trim(), label: label.trim(), input_type: type, required, enabled });
      if (error) throw error;
      toast.success("Requirement added");
      setKey("");
      setLabel("");
      load();
    } catch (e: any) {
      toast("Failed to add requirement", { description: e.message || String(e) });
    }
  };

  const toggleReq = async (id: string, patch: Partial<{ required: boolean; enabled: boolean }>) => {
    const { error } = await supabase.from("kyc_requirements").update(patch as any).eq("id", id);
    if (error) return toast("Failed to update", { description: error.message });
    load();
  };

  const removeReq = async (id: string) => {
    if (!confirm("Delete this requirement?")) return;
    const { error } = await supabase.from("kyc_requirements").delete().eq("id", id);
    if (error) return toast("Failed to delete", { description: error.message });
    load();
  };

  const approve = async (id: string) => {
    const { error } = await supabase.from("kyc_requirement_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast("Failed to approve", { description: error.message });
    toast.success("Approved");
    load();
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Add a rejection reason (optional):", "");
    const { error } = await supabase.from("kyc_requirement_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString(), notes: reason || null }).eq("id", id);
    if (error) return toast("Failed to reject", { description: error.message });
    toast("Marked as rejected");
    load();
  };

  return (
    <main className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configure KYC Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add form */}
          <div className="grid gap-3 sm:grid-cols-6">
            <div className="sm:col-span-1">
              <label className="text-sm">Role</label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-1">
              <label className="text-sm">Key</label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. plate_number" className="h-9" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm">Label</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Vehicle plate number" className="h-9" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-sm">Type</label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button className="w-full" onClick={addRequirement}>Add</Button>
            </div>
          </div>

          {/* List requirements */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="capitalize">{r.role}</TableCell>
                    <TableCell className="font-mono text-xs">{r.key}</TableCell>
                    <TableCell>{r.label}</TableCell>
                    <TableCell>{r.input_type}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={r.required ? "default" : "outline"} onClick={() => toggleReq(r.id, { required: !r.required })}>
                        {r.required ? "Yes" : "No"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={r.enabled ? "default" : "outline"} onClick={() => toggleReq(r.id, { enabled: !r.enabled })}>
                        {r.enabled ? "On" : "Off"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => removeReq(r.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Latest Requirement Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Value / File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => {
                  const r = requirements.find((x) => x.id === s.requirement_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{(s.user_id || '').slice(0, 8)}…</TableCell>
                      <TableCell className="capitalize text-xs">{r?.role}</TableCell>
                      <TableCell className="text-xs">{r?.label}</TableCell>
                      <TableCell className="text-xs break-all">
                        {s.file_path ? (
                          <Button size="sm" variant="outline" onClick={async () => {
                            const { data } = await supabase.storage.from("kyc-docs").createSignedUrl(s.file_path, 300);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          }}>Open file</Button>
                        ) : (
                          s.value_text || "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => reject(s.id)}>Reject</Button>
                            <Button size="sm" onClick={() => approve(s.id)}>Approve</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
