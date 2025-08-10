import { Clock, Truck, Package2, MapPin, Thermometer, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DeliveryMethodsCardProps {
  productKind?: string;
  perishable?: boolean;
  refrigerationRequired?: boolean;
  allowEasyparcel?: boolean;
  allowRiderDelivery?: boolean;
  prepTimeMinutes?: number;
  pickupLat?: number | null;
  pickupLng?: number | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelectDelivery?: (method: 'rider' | 'easyparcel' | 'pickup') => void;
  selectedMethod?: 'rider' | 'easyparcel' | 'pickup';
}

export default function DeliveryMethodsCard({
  productKind,
  perishable,
  refrigerationRequired,
  allowEasyparcel = true,
  allowRiderDelivery = true,
  prepTimeMinutes = 15,
  pickupLat,
  pickupLng,
  userLocation,
  onSelectDelivery,
  selectedMethod = 'rider'
}: DeliveryMethodsCardProps) {
  const isFoodProduct = productKind === 'prepared_food';
  const isGrocery = productKind === 'grocery';
  const isPerishable = perishable || isFoodProduct;

  // Calculate delivery time and distance
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distanceKm = (pickupLat && pickupLng && userLocation)
    ? haversineKm(userLocation.lat, userLocation.lng, pickupLat, pickupLng)
    : null;

  const rideTime = distanceKm ? Math.max(10, Math.round(distanceKm * 3)) : 30;
  const totalDeliveryTime = prepTimeMinutes + rideTime;
  const deliveryRange = `${totalDeliveryTime}-${totalDeliveryTime + 15} mins`;

  // Determine available methods based on product type
  const availableMethods = {
    rider: allowRiderDelivery,
    easyparcel: allowEasyparcel && !isFoodProduct && (!isGrocery || !isPerishable),
    pickup: pickupLat && pickupLng
  };

  const getMethodDetails = (method: string) => {
    switch (method) {
      case 'rider':
        return {
          title: isFoodProduct ? 'Hot Food Delivery' : isGrocery ? 'Fresh Grocery Delivery' : 'Local Rider Delivery',
          icon: <Truck className="h-5 w-5" />,
          time: deliveryRange,
          description: isFoodProduct 
            ? 'Temperature-controlled delivery by local riders' 
            : 'Fast local delivery within your community',
          features: [
            'Real-time tracking',
            `${isFoodProduct ? 'Insulated bags' : 'Secure transport'}`,
            'Direct from vendor',
            distanceKm ? `${distanceKm.toFixed(1)}km away` : 'Local delivery'
          ],
          recommended: isFoodProduct || isPerishable
        };
      case 'easyparcel':
        return {
          title: 'EasyParcel Shipping',
          icon: <Package2 className="h-5 w-5" />,
          time: '1-3 days',
          description: 'Nationwide shipping via courier network',
          features: [
            'Nationwide coverage',
            'Multiple courier options',
            'Package tracking',
            'Insurance included'
          ],
          recommended: !isFoodProduct && !isPerishable
        };
      case 'pickup':
        return {
          title: 'Self Pickup',
          icon: <MapPin className="h-5 w-5" />,
          time: `Ready in ${prepTimeMinutes} mins`,
          description: 'Collect directly from vendor location',
          features: [
            'No delivery fee',
            'Immediate availability',
            'Direct vendor interaction',
            'Flexible timing'
          ],
          recommended: false
        };
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-sm border-l-0 border-r-0 sm:border-l sm:border-r rounded-none sm:rounded-lg overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3 md:pb-6 p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          Delivery Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
        {/* Special handling alerts */}
        {isFoodProduct && (
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm min-w-0">
              <p className="font-medium text-orange-800">Fresh Food Delivery</p>
              <p className="text-orange-700 leading-relaxed">Temperature-controlled delivery by local riders.</p>
            </div>
          </div>
        )}

        {isGrocery && isPerishable && (
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm min-w-0">
              <p className="font-medium text-green-800">Fresh Grocery Item</p>
              <p className="text-green-700 leading-relaxed">Requires local delivery to maintain freshness.</p>
            </div>
          </div>
        )}

        {/* Delivery methods */}
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(availableMethods).map(([method, available]) => {
            if (!available) return null;
            
            const details = getMethodDetails(method);
            if (!details) return null;

            const isSelected = selectedMethod === method;
            const isRecommended = details.recommended;

            return (
              <div key={method} className="relative">
                <button
                  onClick={() => onSelectDelivery?.(method as any)}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all min-h-[44px] ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 left-2 sm:left-4 bg-primary text-primary-foreground text-xs px-2 py-0.5">
                      Recommended
                    </Badge>
                  )}
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {details.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs sm:text-sm md:text-base truncate">{details.title}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{details.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-medium text-primary flex items-center gap-1 text-xs sm:text-sm">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">{details.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 ml-8 sm:ml-10">
                      {details.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <div className="w-1 h-1 bg-current rounded-full flex-shrink-0" />
                          <span className="truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Special badges for product characteristics */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isPerishable && (
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Fresh Product
            </Badge>
          )}
          {refrigerationRequired && (
            <Badge variant="outline" className="text-xs">
              <Thermometer className="h-3 w-3 mr-1" />
              Requires Refrigeration
            </Badge>
          )}
          {isFoodProduct && (
            <Badge variant="outline" className="text-xs">
              🔥 Hot Food
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Community Verified
          </Badge>
        </div>

        {/* Additional info based on selected method */}
        {selectedMethod === 'rider' && availableMethods.rider && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Rider Delivery Details:</p>
            <p className="text-muted-foreground">
              • Delivered by verified community riders
              {isFoodProduct && ' • Insulated delivery bags for hot food'}
              {refrigerationRequired && ' • Temperature-controlled transport'}
            </p>
            <p className="text-muted-foreground">
              • Real-time tracking • Service radius: 10km • Community-based delivery
            </p>
          </div>
        )}

        {selectedMethod === 'easyparcel' && availableMethods.easyparcel && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Shipping Details:</p>
            <p className="text-muted-foreground">
              • Multiple courier options available • Full package tracking
            </p>
            <p className="text-muted-foreground">
              • Insurance included • Nationwide delivery coverage
            </p>
          </div>
        )}

        {selectedMethod === 'pickup' && availableMethods.pickup && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Pickup Details:</p>
            <p className="text-muted-foreground">
              • No delivery charges • Direct from vendor
            </p>
            <p className="text-muted-foreground">
              • Flexible pickup timing • Fresh from source
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}