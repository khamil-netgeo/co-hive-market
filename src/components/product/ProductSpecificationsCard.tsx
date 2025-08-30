import { Package, Star, Award, Shield, Clock, MapPin, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ProductSpecificationsCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    product_kind?: string;
    weight_grams?: number | null;
    length_cm?: number | null;
    width_cm?: number | null;
    height_cm?: number | null;
    perishable?: boolean;
    refrigeration_required?: boolean;
    prep_time_minutes?: number;
    stock_qty?: number;
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    // Preloved fields
    condition?: string | null;
    age_years?: number | null;
    original_price_cents?: number | null;
    wear_description?: string | null;
  };
  vendor?: {
    id: string;
    name?: string;
    rating?: number;
    verified?: boolean;
  };
  userLocation?: { lat: number; lng: number } | null;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
}

export default function ProductSpecificationsCard({
  product,
  vendor,
  userLocation,
  onAddToCart,
  onBuyNow
}: ProductSpecificationsCardProps) {

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

  const distanceKm = (product.pickup_lat && product.pickup_lng && userLocation)
    ? haversineKm(userLocation.lat, userLocation.lng, product.pickup_lat, product.pickup_lng)
    : null;

  const getProductKindLabel = (kind?: string) => {
    switch (kind) {
      case 'prepared_food':
        return { label: 'Prepared Food', icon: '🍽️', color: 'bg-orange-100 text-orange-800' };
      case 'grocery':
        return { label: 'Grocery Item', icon: '🛒', color: 'bg-green-100 text-green-800' };
      case 'preloved':
        return { label: 'Preloved', icon: '♻️', color: 'bg-purple-100 text-purple-800' };
      case 'other':
      default:
        return { label: 'General Product', icon: '📦', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const getConditionLabel = (condition?: string | null) => {
    switch (condition) {
      case 'like_new':
        return { label: 'Like New', color: 'bg-green-100 text-green-800' };
      case 'excellent':
        return { label: 'Excellent', color: 'bg-blue-100 text-blue-800' };
      case 'good':
        return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
      case 'fair':
        return { label: 'Fair', color: 'bg-orange-100 text-orange-800' };
      case 'poor':
        return { label: 'Poor', color: 'bg-red-100 text-red-800' };
      default:
        return null;
    }
  };

  const productKindInfo = getProductKindLabel(product.product_kind);

  const getDimensions = () => {
    const { length_cm, width_cm, height_cm, weight_grams } = product;
    const dimensions = [];
    
    if (length_cm && width_cm && height_cm) {
      dimensions.push(`${length_cm} × ${width_cm} × ${height_cm} cm`);
    }
    
    if (weight_grams) {
      const kg = weight_grams / 1000;
      dimensions.push(kg < 1 ? `${weight_grams}g` : `${kg.toFixed(1)}kg`);
    }
    
    return dimensions.join(' • ');
  };

  return (
    <div className="space-y-6">
      {/* Product Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product type badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${productKindInfo.color} border-0`}>
              {productKindInfo.icon} {productKindInfo.label}
            </Badge>
            {product.product_kind === 'preloved' && product.condition && (() => {
              const conditionInfo = getConditionLabel(product.condition);
              return conditionInfo ? (
                <Badge className={`${conditionInfo.color} border-0 text-xs`}>
                  {conditionInfo.label}
                </Badge>
              ) : null;
            })()}
            {product.perishable && (
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Fresh Product
              </Badge>
            )}
            {product.refrigeration_required && (
              <Badge variant="outline" className="text-xs">
                ❄️ Refrigerated
              </Badge>
            )}
          </div>

          {product.description && (
            <div>
              <h4 className="font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <Separator />

          {/* Product specifications */}
          <div className="grid gap-4">
            {product.stock_qty != null && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Stock Available</p>
                  <p className="text-sm text-muted-foreground">
                    {product.stock_qty} units in stock
                  </p>
                </div>
              </div>
            )}

            {product.prep_time_minutes && product.prep_time_minutes > 0 && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Preparation Time</p>
                  <p className="text-sm text-muted-foreground">
                    {product.prep_time_minutes} minutes to prepare
                  </p>
                </div>
              </div>
            )}

            {distanceKm !== null && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Distance</p>
                  <p className="text-sm text-muted-foreground">
                    {distanceKm.toFixed(1)} km from your location
                  </p>
                </div>
              </div>
            )}

            {getDimensions() && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Dimensions & Weight</p>
                  <p className="text-sm text-muted-foreground">{getDimensions()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Preloved-specific information */}
          {product.product_kind === 'preloved' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-muted-foreground">Preloved Item Details</h4>
                <div className="grid gap-4">
                  {product.age_years && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Item Age</p>
                        <p className="text-sm text-muted-foreground">
                          {product.age_years} year{product.age_years !== 1 ? 's' : ''} old
                        </p>
                      </div>
                    </div>
                  )}

                  {product.original_price_cents && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Original Price</p>
                        <p className="text-sm text-muted-foreground">
                          RM {(product.original_price_cents / 100).toFixed(2)} when new
                        </p>
                      </div>
                    </div>
                  )}

                  {product.wear_description && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="font-medium mb-2">Condition Notes</h5>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {product.wear_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Vendor Information */}
      {vendor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{vendor.name || 'Local Vendor'}</h4>
                  {vendor.verified && (
                    <Badge variant="secondary" className="text-xs">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                {vendor.rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{vendor.rating.toFixed(1)} vendor rating</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Community Verified Vendor</p>
              <p className="text-muted-foreground">
                This vendor is part of your local community marketplace and follows our quality standards.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Features */}
      <Card>
        <CardHeader>
          <CardTitle>Product Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Community marketplace verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Local vendor sourced</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Secure payment processing</span>
            </div>
            {product.product_kind === 'prepared_food' && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Fresh preparation guaranteed</span>
              </div>
            )}
            {product.perishable && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Quality freshness maintained</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Member discount eligible</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onAddToCart}>
          Add to Cart
        </Button>
        <Button variant="hero" className="flex-1" onClick={onBuyNow}>
          Buy Now
        </Button>
      </div>
    </div>
  );
}