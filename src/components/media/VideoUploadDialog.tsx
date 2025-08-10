import { useEffect, useRef, useState } from "react";
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

  // Recording state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const maxDurationSec = 30;
  const maxSizeMB = 100;

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const table = type === "product" ? "products" : "vendor_services";

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      try {
        // @ts-ignore
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      } catch {}
    }
  }, [stream, liveVideoRef]);

  useEffect(() => {
    if (!open) {
      cleanupStream();
      resetRecordingState();
      setUrl(currentUrl || "");
      setRecordError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cleanupStream = () => {
    try {
      recorder?.stop();
    } catch {}
    try {
      stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    setRecorder(null);
    setStream(null);
  };

  const resetRecordingState = () => {
    setChunks([]);
    setRecording(false);
    setRecordedBlob(null);
    setSeconds(0);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestCamera = async () => {
    setRecordError(null);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setStream(st);
    } catch (e: any) {
      setRecordError(e?.message || "Camera/mic permission denied.");
      toast("Cannot access camera", { description: "Please allow camera and microphone access." });
    }
  };

  const getSupportedMime = () => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4", // Some browsers might not allow this via MediaRecorder
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "video/webm";
  };

  const startRecording = async () => {
    if (!stream) {
      await requestCamera();
    }
    const st = stream || (await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true }));
    setStream(st);

    const mimeType = getSupportedMime();
    const rec = new MediaRecorder(st, { mimeType });
    setChunks([]);
    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) setChunks((prev) => [...prev, ev.data]);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      setRecordedBlob(blob);
      if (playbackRef.current) {
        const url = URL.createObjectURL(blob);
        playbackRef.current.src = url;
      }
      cleanupStream();
    };

    rec.start(250);
    setRecorder(rec);
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        if (next >= maxDurationSec) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    try {
      recorder?.stop();
    } catch {}
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast("File too large", { description: `Max ${maxSizeMB}MB allowed.` });
      return;
    }

    setSaving(true);
    try {
      const ext = file.name.split(".").pop() || (file.type.includes("webm") ? "webm" : "mp4");
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

  const uploadRecording = async () => {
    if (!recordedBlob) return;
    const sizeMB = recordedBlob.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast("Recording too large", { description: `Max ${maxSizeMB}MB allowed.` });
      return;
    }
    const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: recordedBlob.type || "video/webm" });
    await onFile(file);
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
            Upload a short MP4/WebM, paste a direct video URL, or record a quick clip. This will appear in the feed.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="paste">Paste link</TabsTrigger>
            <TabsTrigger value="record">Record</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3 mt-3">
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => onFile(e.target.files?.[0] || undefined)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">Max ~{maxSizeMB}MB. Formats: MP4, WebM.</p>
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

          <TabsContent value="record" className="space-y-3 mt-3">
            {!recordedBlob && (
              <div className="space-y-3">
                <div className="aspect-video bg-muted/40 rounded-xl overflow-hidden">
                  <video ref={liveVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                </div>
                {recordError && (
                  <p className="text-sm text-destructive">{recordError}</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">{recording ? `Recording… ${seconds}s / ${maxDurationSec}s` : `Max ${maxDurationSec}s`}</div>
                  <div className="flex gap-2">
                    {!stream && !recording && (
                      <Button variant="outline" onClick={requestCamera}>Enable camera</Button>
                    )}
                    {!recording ? (
                      <Button onClick={startRecording}>Start</Button>
                    ) : (
                      <Button variant="destructive" onClick={stopRecording}>Stop</Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {recordedBlob && (
              <div className="space-y-3">
                <div className="aspect-video bg-muted/40 rounded-xl overflow-hidden">
                  <video ref={playbackRef} className="h-full w-full object-cover" controls playsInline />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { resetRecordingState(); requestCamera(); }}>Retake</Button>
                  <Button onClick={uploadRecording} disabled={saving}>Upload</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
