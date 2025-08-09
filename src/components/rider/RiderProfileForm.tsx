import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useRiderProfile } from '@/hooks/useRiderProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Phone, AlertTriangle } from 'lucide-react';

export default function RiderProfileForm() {
  const { profile, loading, createProfile, updateProfile } = useRiderProfile();
  const { latitude, longitude, getCurrentPosition } = useGeolocation();
  const [formData, setFormData] = useState({
    vehicle_type: profile?.vehicle_type || ('bicycle' as const),
    service_radius_km: profile?.service_radius_km || 5,
    license_number: profile?.license_number || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      current_lat: latitude,
      current_lng: longitude,
    };

    if (profile) {
      await updateProfile(data);
    } else {
      await createProfile(data);
    }
  };

  const updateLocation = () => {
    getCurrentPosition();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Rider Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vehicle Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value: 'bicycle' | 'motorcycle' | 'car' | 'scooter') => 
                  setFormData(prev => ({ ...prev, vehicle_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Service Radius (km)</Label>
              <Input
                id="distance"
                type="number"
                min="1"
                max="50"
                value={formData.service_radius_km}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  service_radius_km: parseInt(e.target.value) 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">License Number (optional)</Label>
              <Input
                id="license"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  license_number: e.target.value 
                }))}
                placeholder="License plate or ID number"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location</h3>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Current Location</p>
                {latitude && longitude ? (
                  <p className="text-sm text-muted-foreground">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm text-destructive">Location not available</p>
                )}
              </div>
              <Button type="button" variant="outline" onClick={updateLocation}>
                Update Location
              </Button>
            </div>
          </div>


          <Button type="submit" className="w-full">
            {profile ? 'Update Profile' : 'Create Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}