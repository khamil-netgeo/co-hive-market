import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MediaUploaderProps {
  bucket: "product-images" | "service-images" | "review-images";
  folder: string; // e.g. `${user.id}` or `${vendor.id}`
  max?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
}

export default function MediaUploader({ bucket, folder, max = 6, value = [], onChange }: MediaUploaderProps) {
  const [urls, setUrls] = useState<string[]>(value);
  const [uploading, setUploading] = useState(false);

  const update = (next: string[]) => {
    setUrls(next);
    onChange?.(next);
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (urls.length + files.length > max) {
      toast("Too many images", { description: `You can upload up to ${max} images.` });
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      update([...urls, ...uploaded]);
      toast.success("Images uploaded");
    } catch (e: any) {
      console.error(e);
      toast("Upload failed", { description: e?.message || String(e) });
    } finally {
      setUploading(false);
      // reset input to allow re-selecting same files
      e.currentTarget.value = "";
    }
  };

  const removeAt = async (idx: number) => {
    const url = urls[idx];
    // Attempt best-effort deletion from storage (optional)
    try {
      const prefix = `/storage/v1/object/public/${bucket}/`;
      const i = url.indexOf(prefix);
      if (i !== -1) {
        const objectPath = url.slice(i + prefix.length);
        await supabase.storage.from(bucket).remove([objectPath]);
      }
    } catch (e) {
      // ignore deletion errors
    }
    const next = urls.filter((_, i) => i !== idx);
    update(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Images</Label>
        <Input type="file" accept="image/*" multiple onChange={onFiles} disabled={uploading} />
        <p className="text-sm text-muted-foreground">Upload up to {max} images. First image is used as cover.</p>
      </div>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {urls.map((u, i) => (
            <div key={u} className="relative group">
              <img src={u} alt={`Uploaded image ${i + 1}`} className="aspect-square w-full object-cover rounded-md border" loading="lazy" />
              <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAt(i)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
