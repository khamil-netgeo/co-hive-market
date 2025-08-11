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
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 w-full max-w-full min-w-0">
      <CardContent className="p-3 sm:p-4 w-full max-w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-full min-w-0">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/20 shrink-0">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 max-w-full">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 w-full max-w-full min-w-0">
              <h3 className="font-semibold text-xs sm:text-sm break-words min-w-0">
                {productKind === 'prepared_food' ? '🍕 Fresh Food Delivery' : '🛒 Grocery Delivery'}
              </h3>
              {perishable && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Fresh
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground w-full max-w-full min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" />
                <span className="whitespace-nowrap">{estimatedDeliveryTime}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" />
                <span className="whitespace-nowrap">Within {deliveryRadius}km</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}