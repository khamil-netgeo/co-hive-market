import React, { useMemo, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Play } from "lucide-react";

type MediaGalleryProps = {
  images?: string[] | null;
  videos?: string[] | null; // pass an array even if single
  alt: string;
  aspect?: "video" | "square"; // 16:9 or 1:1
  className?: string;
  showThumbnails?: boolean;
};

export default function MediaGallery({ images, videos, alt, aspect = "video", className, showThumbnails = true }: MediaGalleryProps) {
  const slides = useMemo(() => {
    const imgSlides = (images || []).filter(Boolean).map((src) => ({ type: "image" as const, src }));
    const vidSlides = (videos || []).filter(Boolean).map((src) => ({ type: "video" as const, src }));
    return [...imgSlides, ...vidSlides];
  }, [images, videos]);

  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (slides.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center", aspect === "video" ? "aspect-video" : "aspect-square", className)}>
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("relative w-full overflow-hidden rounded-lg border bg-background", aspect === "video" ? "aspect-video" : "aspect-square")}>        
        <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} className="h-full">
          <CarouselContent className="h-full">
            {slides.map((s, idx) => (
              <CarouselItem key={idx} className="h-full">
                <div className={cn("h-full w-full flex items-center justify-center bg-background")}>                  
                  {s.type === "image" ? (
                    <img
                      src={s.src}
                      alt={`${alt} ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={s.src}
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                      playsInline
                    />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" aria-label="Previous media" />
          <CarouselNext className="hidden sm:flex" aria-label="Next media" />
        </Carousel>
      </div>

      {/* Thumbnails */}
      {showThumbnails && slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar" aria-label="Media thumbnails">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => api?.scrollTo(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded border transition-opacity",
                current === idx ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
              )}
              aria-label={`Show ${s.type} ${idx + 1}`}
            >
              {s.type === "image" ? (
                <img src={s.src} alt={`${alt} thumbnail ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="h-full w-full bg-black/60 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
