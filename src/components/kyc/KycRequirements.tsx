import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  role: "buyer" | "vendor" | "rider" | "admin";
}

type Requirement = {
  id: string;
  role: string;
  key: string;
  label: string;
  description: string | null;
  input_type: "file" | "text" | "number" | "date";
  required: boolean;
  enabled: boolean;
};

type Submission = {
  id: string;
  requirement_id: string;
  status: string;
  notes: string | null;
  value_text: string | null;
  file_path: string | null;
};

export default function KycRequirements({ role }: Props) {
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [subs, setSubs] = useState<Record<string, Submission | null>>({});
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          setLoading(false);
          return;
        }
        const [{ data: r, error: rErr }, { data: s, error: sErr }] = await Promise.all([
          supabase.from("kyc_requirements").select("id,role,key,label,description,input_type,required,enabled").eq("role", role).eq("enabled", true),
          supabase.from("kyc_requirement_submissions").select("id,requirement_id,status,notes,value_text,file_path").eq("user_id", uid),
        ]);
        if (rErr) throw rErr;
        if (sErr) throw sErr;
        setReqs((r || []) as any);
        const map: Record<string, Submission | null> = {};
        (r || []).forEach((req: any) => {
          const match = (s || []).find((x: any) => x.requirement_id === req.id) || null;
          map[req.id] = match as any;
        });
        setSubs(map);
      } catch (e: any) {
        toast("Failed to load requirements", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  const disabled = useMemo(() => saving, [saving]);

  const onFile = (reqId: string, f: File | null) =>
    setFiles((prev) => ({ ...prev, [reqId]: f }));
  const onValue = (reqId: string, v: string) =>
    setValues((prev) => ({ ...prev, [reqId]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      for (const req of reqs) {
        const existing = subs[req.id];
        let file_path: string | null = existing?.file_path ?? null;
        let value_text: string | null = existing?.value_text ?? null;

        if (req.input_type === "file") {
          const f = files[req.id] ?? null;
          if (f) {
            const path = `${uid}/requirements/${role}/${req.key}-${Date.now()}-${f.name}`;
            const { error: upErr } = await supabase.storage.from("kyc-docs").upload(path, f, { upsert: false, cacheControl: "3600" });
            if (upErr) throw upErr;
            file_path = path;
          }
        } else {
          const v = values[req.id]?.trim() ?? "";
          if (v) value_text = v;
        }

        // Skip if nothing new provided
        if (!files[req.id] && !values[req.id]) continue;

        if (existing) {
          const { error } = await supabase
            .from("kyc_requirement_submissions")
            .update({ file_path, value_text, status: "pending", notes: null })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("kyc_requirement_submissions")
            .insert({ user_id: uid, requirement_id: req.id, file_path, value_text, status: "pending" });
          if (error) throw error;
        }
      }

      toast.success("Requirements submitted. We will review shortly.");
      // Refresh
      const { data: s } = await supabase.from("kyc_requirement_submissions").select("id,requirement_id,status,notes,value_text,file_path").in(
        "requirement_id",
        reqs.map((r) => r.id)
      );
      const map: Record<string, Submission | null> = {};
      (reqs || []).forEach((req) => {
        const match = (s || []).find((x: any) => x.requirement_id === req.id) || null;
        map[req.id] = match as any;
      });
      setSubs(map);
      setFiles({});
      setValues({});
    } catch (e: any) {
      toast("Failed to submit requirements", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Requirements for {role.charAt(0).toUpperCase() + role.slice(1)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : reqs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No additional requirements configured.</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {reqs.map((r) => {
                const sub = subs[r.id];
                return (
                  <div key={r.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{r.label}</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={sub?.status === "approved" ? "default" : sub?.status === "rejected" ? "destructive" : "secondary"}>
                          {sub?.status ?? "not submitted"}
                        </Badge>
                        {r.required && <Badge variant="outline">Required</Badge>}
                      </div>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}

                    {r.input_type === "file" ? (
                      <Input type="file" accept="image/*,application/pdf" disabled={disabled} onChange={(e) => onFile(r.id, e.target.files?.[0] ?? null)} />
                    ) : r.input_type === "number" ? (
                      <Input type="number" disabled={disabled} defaultValue={sub?.value_text ?? ""} onChange={(e) => onValue(r.id, e.target.value)} />
                    ) : r.input_type === "date" ? (
                      <Input type="date" disabled={disabled} defaultValue={sub?.value_text ?? ""} onChange={(e) => onValue(r.id, e.target.value)} />
                    ) : (
                      <Input type="text" disabled={disabled} defaultValue={sub?.value_text ?? ""} onChange={(e) => onValue(r.id, e.target.value)} />
                    )}

                    {sub?.file_path && (
                      <a
                        className="text-xs text-primary underline"
                        href={supabase.storage.from("kyc-docs").getPublicUrl("dummy").data.publicUrl && "#"}
                        onClick={async (e) => {
                          e.preventDefault();
                          const { data } = await supabase.storage.from("kyc-docs").createSignedUrl(sub.file_path!, 300);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                        }}
                      >
                        View current file
                      </a>
                    )}

                    {sub?.notes && <p className="text-xs text-muted-foreground">Note: {sub.notes}</p>}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={submit} disabled={disabled}>{saving ? "Submitting…" : "Submit for Review"}</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
