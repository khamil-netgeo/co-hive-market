import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUploadDialogProps {
  vendorId: string;
  itemId: string;
  type: "product" | "service";
  currentUrl?: string | null;
  onDone?: (url: string) => void;
  buttonText?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

export default function VideoUploadDialog({
  vendorId,
  itemId,
  type,
  currentUrl,
  onDone,
  buttonText = "Add Clip",
  buttonVariant = "tiktok" as any,
  size = "sm",
}: VideoUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState(currentUrl || "");

  const table = type === "product" ? "products" : "vendor_services";

  const saveUrl = async (videoUrl: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ video_url: videoUrl })
        .eq("id", itemId)
        .eq("vendor_id", vendorId);
      if (error) throw error;
      toast("Clip saved", { description: "Your shoppable clip is now attached." });
      onDone?.(videoUrl);
      setOpen(false);
    } catch (e: any) {
      toast("Failed to save clip", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast("Unsupported file", { description: "Please upload an MP4 or WebM video." });
      return;
    }
    setSaving(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${vendorId}/${type}s/${itemId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("short-videos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("short-videos").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      await saveUrl(publicUrl);
    } catch (e: any) {
      toast("Upload failed", { description: e.message || String(e) });
      setSaving(false);
    }
  };

  const onPasteSave = async () => {
    if (!/^https?:\/\//i.test(url)) {
      toast("Invalid link", { description: "Paste a valid https URL to a direct MP4/WebM file." });
      return;
    }
    await saveUrl(url.trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={size} disabled={saving}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentUrl ? "Update shoppable clip" : "Add shoppable clip"}</DialogTitle>
          <DialogDescription>
            Upload a short MP4/WebM or paste a direct video URL. This will appear in the feed.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="paste">Paste link</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3 mt-3">
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => onFile(e.target.files?.[0] || undefined)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">Max ~100MB recommended. Formats: MP4, WebM.</p>
          </TabsContent>

          <TabsContent value="paste" className="space-y-3 mt-3">
            <Input
              placeholder="https://...direct-file.mp4 or .webm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={saving}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={onPasteSave} disabled={saving}>
                Save link
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
