import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TripMap from './TripMap';
import { Navigation, CheckCircle, Play, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TripPanelProps {
  delivery: {
    id: string;
    status: string;
    pickup_address?: string | null;
    dropoff_address?: string | null;
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    dropoff_lat?: number | null;
    dropoff_lng?: number | null;
  } | null;
}

function openMaps(lat?: number | null, lng?: number | null) {
  if (!lat || !lng) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank');
}

export default function TripPanel({ delivery }: TripPanelProps) {
  if (!delivery) return null;

  const update = async (action: 'start_pickup' | 'picked_up' | 'start_dropoff' | 'delivered') => {
    const { error } = await supabase.functions.invoke('rider-update-delivery', {
      body: { delivery_id: delivery.id, action },
    });
    if (error) {
      toast('Failed', { description: error.message });
    } else {
      toast('Updated', { description: 'Delivery status updated' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Trip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TripMap
          pickup={delivery.pickup_lat && delivery.pickup_lng ? { lat: delivery.pickup_lat, lng: delivery.pickup_lng, label: delivery.pickup_address || 'Pickup' } : undefined}
          dropoff={delivery.dropoff_lat && delivery.dropoff_lng ? { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng, label: delivery.dropoff_address || 'Dropoff' } : undefined}
          heightClass="h-56"
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => openMaps(delivery.pickup_lat, delivery.pickup_lng)}>
            <Navigation className="mr-2 h-4 w-4" /> Navigate to Pickup
          </Button>
          <Button variant="outline" onClick={() => openMaps(delivery.dropoff_lat, delivery.dropoff_lng)}>
            <Flag className="mr-2 h-4 w-4" /> Navigate to Dropoff
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={() => update('start_pickup')}>
            <Play className="mr-2 h-4 w-4" /> Start Pickup
          </Button>
          <Button onClick={() => update('picked_up')}>
            <CheckCircle className="mr-2 h-4 w-4" /> Mark Picked Up
          </Button>
          <Button onClick={() => update('start_dropoff')}>
            <Play className="mr-2 h-4 w-4" /> Start Dropoff
          </Button>
          <Button onClick={() => update('delivered')}>
            <CheckCircle className="mr-2 h-4 w-4" /> Complete Delivery
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">Status: <span className="text-foreground font-medium">{delivery.status}</span></div>
      </CardContent>
    </Card>
  );
}
