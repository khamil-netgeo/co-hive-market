import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MediaUploader from "@/components/media/MediaUploader";
import { Camera, Video } from "lucide-react";

interface ServiceMediaProps {
  userId?: string;
  imageUrls: string[];
  videoUrl: string;
  onImageUrlsChange: (urls: string[]) => void;
  onVideoUrlChange: (url: string) => void;
}

export default function ServiceMedia({ 
  userId, 
  imageUrls, 
  videoUrl, 
  onImageUrlsChange, 
  onVideoUrlChange 
}: ServiceMediaProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Media</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <FormLabel className="text-base">Service images</FormLabel>
            <p className="text-sm text-muted-foreground mb-3">
              Upload photos that showcase your service quality and setup
            </p>
            <MediaUploader 
              bucket="service-images" 
              folder={`${userId || 'anonymous'}/services`} 
              value={imageUrls} 
              onChange={onImageUrlsChange} 
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-4 w-4 text-primary" />
              <FormLabel className="text-base">Promo video URL (optional)</FormLabel>
            </div>
            <Input 
              placeholder="https://... (YouTube, Vimeo or direct MP4 link)" 
              value={videoUrl} 
              onChange={(e) => onVideoUrlChange(e.target.value)} 
            />
            <p className="text-sm text-muted-foreground mt-1">
              Add a video to increase bookings by up to 40%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}