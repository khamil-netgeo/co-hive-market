import { Truck, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeliveryBannerProps {
  productKind?: string;
  perishable?: boolean;
  estimatedDeliveryTime?: string;
  deliveryRadius?: number;
}

export default function DeliveryBanner({ 
  productKind, 
  perishable, 
  estimatedDeliveryTime = "30-60 mins",
  deliveryRadius = 10 
}: DeliveryBannerProps) {
  const isFoodOrGrocery = productKind === 'prepared_food' || productKind === 'grocery';
  
  if (!isFoodOrGrocery) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">
                {productKind === 'prepared_food' ? '🍕 Fresh Food Delivery' : '🛒 Grocery Delivery'}
              </h3>
              {perishable && (
                <Badge variant="secondary" className="text-xs">
                  Fresh
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{estimatedDeliveryTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Within {deliveryRadius}km</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}