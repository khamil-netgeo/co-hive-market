import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, File, X } from "lucide-react";

interface PayoutProofUploaderProps {
  payoutId: string;
  currentProofPath?: string | null;
  onUploadComplete: (proofPath: string) => void;
}

export default function PayoutProofUploader({ 
  payoutId, 
  currentProofPath, 
  onUploadComplete 
}: PayoutProofUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type", { 
          description: "Please upload an image (JPEG, PNG, GIF, WebP) or PDF file." 
        });
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", { 
          description: "Please upload a file smaller than 10MB." 
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/payout-${payoutId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payout-proofs')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('payout-proofs')
        .getPublicUrl(fileName);

      onUploadComplete(fileName);
      setSelectedFile(null);
      toast.success("Proof uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const viewProof = () => {
    if (currentProofPath) {
      const { data } = supabase.storage
        .from('payout-proofs')
        .getPublicUrl(currentProofPath);
      window.open(data.publicUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      <Label>Payment Proof</Label>
      
      {currentProofPath && (
        <div className="flex items-center gap-2 p-2 border rounded">
          <File className="h-4 w-4" />
          <span className="text-sm truncate flex-1">Proof attached</span>
          <Button size="sm" variant="outline" onClick={viewProof}>
            View
          </Button>
        </div>
      )}

      {selectedFile ? (
        <div className="flex items-center gap-2 p-2 border rounded">
          <File className="h-4 w-4" />
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          <Button size="sm" variant="outline" onClick={removeFile}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Upload payment receipt/proof (Images or PDF, max 10MB)
          </p>
        </div>
      )}

      {selectedFile && (
        <Button 
          onClick={handleUpload} 
          disabled={uploading}
          size="sm"
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Proof"}
        </Button>
      )}
    </div>
  );
}