import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ServiceImage from "@/components/service/ServiceImage";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Star } from "lucide-react";

interface ServicePreviewProps {
  name: string;
  subtitle?: string;
  price: string;
  currency: string;
  duration?: string;
  locationType?: string;
  imageUrls: string[];
  pricingModel?: string;
}

export default function ServicePreview({ 
  name, 
  subtitle, 
  price, 
  currency, 
  duration, 
  locationType, 
  imageUrls,
  pricingModel 
}: ServicePreviewProps) {
  const formatPrice = () => {
    const p = parseFloat(price || "0");
    const cur = (currency || "MYR").toUpperCase();
    if (isNaN(p) || p === 0) return "Price not set";
    return new Intl.NumberFormat(cur === "MYR" ? "ms-MY" : "en-US", { 
      style: "currency", 
      currency: cur 
    }).format(p);
  };

  const getLocationIcon = () => {
    switch (locationType) {
      case "customer": return "🏠";
      case "remote": return "💻";
      default: return "🏢";
    }
  };

  const getLocationLabel = () => {
    switch (locationType) {
      case "customer": return "At customer";
      case "remote": return "Remote/Online";
      default: return "At vendor";
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <ServiceImage 
            imageUrls={imageUrls} 
            serviceName={name || "Service"} 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold line-clamp-2">
            {name || "Untitled Service"}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-primary">
            {formatPrice()}
          </div>
          {pricingModel && pricingModel !== "fixed" && (
            <Badge variant="secondary" className="text-xs">
              {pricingModel === "hourly" ? "per hour" : "per unit"}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{duration} minutes</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{getLocationIcon()} {getLocationLabel()}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            This is how your service will appear to customers
          </p>
        </div>
      </CardContent>
    </Card>
  );
}