import { Clock, CalendarDays, Star, Award, Truck, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ServiceDetailsCardProps {
  service: {
    id: string;
    name: string;
    subtitle?: string | null;
    description?: string | null;
    duration_minutes?: number | null;
    service_area?: string | null;
    location_type?: string | null;
    availability_preset?: string | null;
  };
  vendor?: {
    id: string;
    name?: string;
    rating?: number;
    total_reviews?: number;
    response_time?: string;
    verified?: boolean;
  };
  onBookNow?: () => void;
  onContactVendor?: () => void;
}

export default function ServiceDetailsCard({
  service,
  vendor,
  onBookNow,
  onContactVendor
}: ServiceDetailsCardProps) {
  
  const formatAvailability = (preset?: string | null) => {
    if (!preset) return 'By appointment';
    
    switch (preset) {
      case 'weekdays_9_6':
        return 'Weekdays 9AM - 6PM';
      case 'weekends_only':
        return 'Weekends only';
      case 'flexible':
        return 'Flexible scheduling';
      case '24_7':
        return '24/7 availability';
      default:
        return preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatLocationType = (type?: string | null) => {
    if (!type) return null;
    
    switch (type) {
      case 'vendor':
        return 'At vendor location';
      case 'customer':
        return 'At your location';
      case 'flexible':
        return 'Flexible location';
      case 'online':
        return 'Online service';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {service.subtitle && (
            <div>
              <h4 className="font-medium text-muted-foreground mb-1">Service Type</h4>
              <p className="text-lg">{service.subtitle}</p>
            </div>
          )}

          {service.description && (
            <div>
              <h4 className="font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{service.description}</p>
            </div>
          )}

          <Separator />

          {/* Service specifications */}
          <div className="grid gap-4">
            {service.duration_minutes && service.duration_minutes > 0 && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {service.duration_minutes < 60 
                      ? `${service.duration_minutes} minutes`
                      : `${Math.floor(service.duration_minutes / 60)}h ${service.duration_minutes % 60}m`
                    }
                  </p>
                </div>
              </div>
            )}

            {service.service_area && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Service Area</p>
                  <p className="text-sm text-muted-foreground">{service.service_area}</p>
                </div>
              </div>
            )}

            {formatLocationType(service.location_type) && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{formatLocationType(service.location_type)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Availability</p>
                <p className="text-sm text-muted-foreground">{formatAvailability(service.availability_preset)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Information */}
      {vendor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Service Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt={vendor.name || 'Vendor'} />
                <AvatarFallback>
                  {vendor.name?.slice(0, 2).toUpperCase() || 'V'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{vendor.name || 'Professional Service Provider'}</h4>
                  {vendor.verified && (
                    <Badge variant="secondary" className="text-xs">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                {vendor.rating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{vendor.rating.toFixed(1)}</span>
                    </div>
                    {vendor.total_reviews && (
                      <span>({vendor.total_reviews} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {vendor.response_time && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Typical response time:</span> {vendor.response_time}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onContactVendor}>
                Contact Provider
              </Button>
              <Button variant="hero" className="flex-1" onClick={onBookNow}>
                Book Service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Features */}
      <Card>
        <CardHeader>
          <CardTitle>What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Professional service delivery</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Community verified provider</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Customer support assistance</span>
            </div>
            {service.duration_minutes && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Guaranteed time commitment</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}