import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AvatarUploaderProps {
  title?: string;
}

export default function AvatarUploader({ title = "Avatar" }: AvatarUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { data: row } = await supabase.from("profiles").select("avatar_url").eq("id", uid).maybeSingle();
      if (row?.avatar_url) setCurrentUrl(row.avatar_url);
    };
    load();
  }, []);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : currentUrl ?? undefined), [file, currentUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast("File too large", { description: "Max size 5MB" });
      return;
    }
    setFile(f);
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) throw new Error("Not signed in");
      const path = `${uid}/avatar-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", uid);
      if (updErr) throw updErr;
      setCurrentUrl(pub.publicUrl);
      setFile(null);
      toast.success("Avatar updated");
    } catch (e: any) {
      toast("Failed to update avatar", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover border" loading="lazy" />
          ) : (
            <div className="h-20 w-20 rounded-full border flex items-center justify-center text-muted-foreground">No image</div>
          )}
          <div className="flex-1 space-y-2">
            <Label htmlFor="avatar">Upload new</Label>
            <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
            <p className="text-xs text-muted-foreground">Max 5MB. Square images look best.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={!file || saving}>{saving ? "Saving…" : "Save avatar"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
