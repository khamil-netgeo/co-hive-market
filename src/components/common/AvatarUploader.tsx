import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";

interface AvatarUploaderProps {
  title?: string;
}

export default function AvatarUploader({ title = "Avatar" }: AvatarUploaderProps) {
  const { user } = useAuthRoles();
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
  const initials = useMemo(() => (user?.email?.[0] || "?").toUpperCase(), [user?.email]);

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
      <CardContent className="space-y-6">
        {/* Large Avatar Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={previewUrl} alt="Profile avatar" />
              <AvatarFallback className="text-2xl font-semibold bg-gradient-primary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* User Info */}
          <div className="text-center">
            <div className="font-medium text-lg">{user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        {/* Upload Controls */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="avatar">Upload new avatar</Label>
            <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
            <p className="text-xs text-muted-foreground">Max 5MB. Square images look best.</p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={save} disabled={!file || saving}>
              {saving ? "Updating…" : "Update Avatar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
