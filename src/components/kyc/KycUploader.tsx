import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface KycUploaderProps {
  role: "buyer" | "vendor" | "rider";
}

type Submission = {
  id: string;
  status: string;
  front_id_path: string | null;
  back_id_path: string | null;
  selfie_path: string | null;
  notes: string | null;
  created_at: string;
};

export default function KycUploader({ role }: KycUploaderProps) {
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [signed, setSigned] = useState<{ front?: string; back?: string; selfie?: string }>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return setLoading(false);
      const { data: row, error } = await supabase
        .from("kyc_submissions")
        .select("id,status,front_id_path,back_id_path,selfie_path,notes,created_at")
        .eq("user_id", uid)
        .eq("role", role)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && row) {
        setSub(row as any);
        // Create signed preview URLs (best-effort)
        const s: any = {};
        if (row.front_id_path) {
          const { data: u } = await supabase.storage.from("kyc-docs").createSignedUrl(row.front_id_path, 300);
          s.front = u?.signedUrl;
        }
        if (row.back_id_path) {
          const { data: u } = await supabase.storage.from("kyc-docs").createSignedUrl(row.back_id_path, 300);
          s.back = u?.signedUrl;
        }
        if (row.selfie_path) {
          const { data: u } = await supabase.storage.from("kyc-docs").createSignedUrl(row.selfie_path, 300);
          s.selfie = u?.signedUrl;
        }
        setSigned(s);
      }
      setLoading(false);
    };
    load();
  }, [role]);

  const disabled = useMemo(() => sub?.status === "pending" || sub?.status === "approved", [sub?.status]);

  const validateFile = (f: File | null) => {
    if (!f) return true;
    const okType = ["image/jpeg", "image/png", "application/pdf"].includes(f.type);
    const okSize = f.size <= 5 * 1024 * 1024;
    return okType && okSize;
  };

  const submit = async () => {
    if (disabled) return;
    if (!validateFile(front) || !validateFile(back) || !validateFile(selfie)) {
      toast("Invalid files", { description: "Use JPG/PNG/PDF up to 5MB." });
      return;
    }
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) throw new Error("Not signed in");

      const upload = async (f: File | null, key: string) => {
        if (!f) return null;
        const path = `${uid}/${role}/${key}-${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from("kyc-docs").upload(path, f, { upsert: false, cacheControl: "3600" });
        if (error) throw error;
        return path;
      };

      const frontPath = await upload(front, "front");
      const backPath = await upload(back, "back");
      const selfiePath = await upload(selfie, "selfie");

      if (sub && sub.status === "rejected") {
        // Update existing rejected submission to pending with new docs
        const { error } = await supabase
          .from("kyc_submissions")
          .update({
            status: "pending",
            front_id_path: frontPath ?? sub.front_id_path,
            back_id_path: backPath ?? sub.back_id_path,
            selfie_path: selfiePath ?? sub.selfie_path,
            notes: null,
          })
          .eq("id", sub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kyc_submissions")
          .insert({
            user_id: uid,
            role,
            status: "pending",
            front_id_path: frontPath,
            back_id_path: backPath,
            selfie_path: selfiePath,
          });
        if (error) throw error;
      }

      toast.success("KYC submitted. We'll notify you after review.");
      setSub({ ...(sub as any), status: "pending" } as any);
    } catch (e: any) {
      toast("Failed to submit KYC", { description: e.message || String(e) });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification (eKYC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span>Status:</span>
              <Badge variant={sub?.status === "approved" ? "default" : sub?.status === "rejected" ? "destructive" : "secondary"}>
                {sub?.status ?? "not submitted"}
              </Badge>
              {sub?.notes && <span className="text-xs text-muted-foreground">• {sub.notes}</span>}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Front of ID</Label>
                <Input type="file" accept="image/*,application/pdf" disabled={disabled} onChange={(e) => setFront(e.target.files?.[0] ?? null)} />
                {signed.front && <a className="text-xs text-primary underline" href={signed.front} target="_blank" rel="noreferrer">View current</a>}
              </div>
              <div className="space-y-2">
                <Label>Back of ID</Label>
                <Input type="file" accept="image/*,application/pdf" disabled={disabled} onChange={(e) => setBack(e.target.files?.[0] ?? null)} />
                {signed.back && <a className="text-xs text-primary underline" href={signed.back} target="_blank" rel="noreferrer">View current</a>}
              </div>
              <div className="space-y-2">
                <Label>Selfie</Label>
                <Input type="file" accept="image/*" disabled={disabled} onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} />
                {signed.selfie && <a className="text-xs text-primary underline" href={signed.selfie} target="_blank" rel="noreferrer">View current</a>}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={submit} disabled={disabled || uploading}>
                {uploading ? "Submitting…" : sub?.status === "rejected" ? "Resubmit for Review" : "Submit for Review"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
