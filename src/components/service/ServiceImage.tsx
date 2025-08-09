import { Wrench } from "lucide-react";

interface ServiceImageProps {
  imageUrls?: string[] | null;
  serviceName: string;
  className?: string;
  fallbackClassName?: string;
}

export default function ServiceImage({ 
  imageUrls, 
  serviceName, 
  className = "w-full h-48 object-cover rounded-md",
  fallbackClassName = "w-full h-48 bg-muted rounded-md flex items-center justify-center"
}: ServiceImageProps) {
  const firstImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;

  if (firstImage) {
    return (
      <img
        src={firstImage}
        alt={serviceName}
        className={className}
        loading="lazy"
        onError={(e) => {
          // If image fails to load, hide it and show fallback
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      <Wrench className="h-12 w-12 text-muted-foreground" />
    </div>
  );
}