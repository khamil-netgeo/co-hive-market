import { Package } from "lucide-react";

interface ProductImageProps {
  imageUrls?: string[] | null;
  productName: string;
  className?: string;
  fallbackClassName?: string;
}

export default function ProductImage({ 
  imageUrls, 
  productName, 
  className = "w-full h-48 object-cover rounded-md",
  fallbackClassName = "w-full h-48 bg-muted rounded-md flex items-center justify-center"
}: ProductImageProps) {
  const firstImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;

  if (firstImage) {
    return (
      <>
        <img
          src={firstImage}
          alt={productName}
          className={className}
          loading="lazy"
          onError={(e) => {
            // If image fails to load, hide it and show fallback sibling
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className={fallbackClassName} style={{ display: 'none' }}>
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <div className={fallbackClassName}>
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
  );
}