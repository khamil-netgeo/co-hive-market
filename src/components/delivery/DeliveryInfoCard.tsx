import { Clock, MapPin, Shield, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeliveryInfoCardProps {
  productKind?: string;
  perishable?: boolean;
  refrigerationRequired?: boolean;
  prepTimeMinutes?: number;
  pickupAddress?: string;
}

export default function DeliveryInfoCard({ 
  productKind, 
  perishable, 
  refrigerationRequired,
  prepTimeMinutes,
  pickupAddress 
}: DeliveryInfoCardProps) {
  const isFoodOrGrocery = productKind === 'prepared_food' || productKind === 'grocery';
  
  if (!isFoodOrGrocery) return null;

  const getDeliveryType = () => {
    if (productKind === 'prepared_food') return 'Hot Food Delivery';
    if (productKind === 'grocery' && perishable) return 'Fresh Grocery Delivery';
    return 'Grocery Delivery';
  };

  const getEstimatedTime = () => {
    const base = 30; // Base delivery time
    const prep = prepTimeMinutes || 0;
    return `${prep + base}-${prep + base + 30} mins`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          {getDeliveryType()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Estimated delivery: {getEstimatedTime()}</span>
        </div>
        
        {prepTimeMinutes && prepTimeMinutes > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Preparation time: {prepTimeMinutes} minutes</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {perishable && (
            <Badge variant="secondary" className="text-xs">
              Fresh Product
            </Badge>
          )}
          {refrigerationRequired && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Thermometer className="h-3 w-3" />
              Refrigerated
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            Local Delivery Only
          </Badge>
        </div>
        
        {pickupAddress && (
          <div className="text-xs text-muted-foreground">
            <strong>Pickup from:</strong> {pickupAddress}
          </div>
        )}
        
        <div className="bg-muted/50 p-3 rounded-lg text-xs">
          <p className="font-medium mb-1">Delivery by local riders</p>
          <p className="text-muted-foreground">
            Our network of verified local riders ensures fresh delivery within your community.
            {productKind === 'prepared_food' && ' Food stays hot with insulated delivery bags.'}
            {perishable && ' Temperature-controlled transport for fresh items.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}