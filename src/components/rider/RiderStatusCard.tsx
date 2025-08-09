import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRiderProfile } from '@/hooks/useRiderProfile';
import { MapPin, Star, Package, Clock, Phone } from 'lucide-react';

export default function RiderStatusCard() {
  const { profile, loading, isOnline, toggleOnlineStatus } = useRiderProfile();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Complete your rider profile to start accepting deliveries
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rider Status
          </span>
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Online/Offline Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">Available for Deliveries</p>
            <p className="text-sm text-muted-foreground">
              Toggle to start receiving delivery requests
            </p>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnlineStatus}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{profile.rating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Rating</p>
          </div>
          
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{profile.total_deliveries}</p>
            <p className="text-sm text-muted-foreground">Deliveries</p>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="space-y-2">
          <p className="font-medium">Vehicle Information</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 capitalize">{profile.vehicle_type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Range:</span>
              <span className="ml-2">{profile.service_radius_km}km</span>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">Verification Status</p>
          <p className={`text-sm ${profile.is_verified ? 'text-green-600' : 'text-orange-600'}`}>
            {profile.is_verified ? '✓ Verified' : '⚠ Pending Verification'}
          </p>
        </div>

        {/* Location Status */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">Location Status</p>
          {profile.current_lat && profile.current_lng ? (
            <p className="text-sm text-green-600">✓ Location tracking active</p>
          ) : (
            <p className="text-sm text-destructive">⚠ Location not available</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button variant="outline" size="sm" className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            View Delivery History
          </Button>
          
          <Button variant="outline" size="sm" className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}