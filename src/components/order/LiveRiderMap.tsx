import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLiveRiderTracking } from '@/hooks/useLiveRiderTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Truck,
  AlertTriangle
} from 'lucide-react';

interface LiveRiderMapProps {
  orderId: string;
  delivery?: {
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    dropoff_lat?: number | null;
    dropoff_lng?: number | null;
    pickup_address?: string;
    dropoff_address?: string;
    status?: string;
  } | null;
  heightClass?: string;
}

export default function LiveRiderMap({ orderId, delivery, heightClass = 'h-80' }: LiveRiderMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const riderMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { riderLocation, eta, isTracking, calculateETA } = useLiveRiderTracking(orderId);
  const [mapReady, setMapReady] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        const { data, error } = await supabase.functions.invoke('mapbox-token');
        if (error) throw error;
        
        const token = (data?.token || data?.access_token || data) as string;
        if (!token) throw new Error('Missing Mapbox token');
        
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [101.6869, 3.139], // Default to KL
          zoom: 12,
        });

        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          if (cancelled) return;
          setMapReady(true);

          // Add pickup marker
          if (delivery?.pickup_lat && delivery?.pickup_lng) {
            new mapboxgl.Marker({ color: '#22c55e' })
              .setLngLat([delivery.pickup_lng, delivery.pickup_lat])
              .setPopup(new mapboxgl.Popup().setText(delivery.pickup_address || 'Pickup Location'))
              .addTo(map);
          }

          // Add dropoff marker
          if (delivery?.dropoff_lat && delivery?.dropoff_lng) {
            new mapboxgl.Marker({ color: '#ef4444' })
              .setLngLat([delivery.dropoff_lng, delivery.dropoff_lat])
              .setPopup(new mapboxgl.Popup().setText(delivery.dropoff_address || 'Delivery Location'))
              .addTo(map);
          }

          // Fit bounds to show all markers
          const bounds = new mapboxgl.LngLatBounds();
          let hasPoints = false;

          if (delivery?.pickup_lat && delivery?.pickup_lng) {
            bounds.extend([delivery.pickup_lng, delivery.pickup_lat]);
            hasPoints = true;
          }
          if (delivery?.dropoff_lat && delivery?.dropoff_lng) {
            bounds.extend([delivery.dropoff_lng, delivery.dropoff_lat]);
            hasPoints = true;
          }

          if (hasPoints) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
          }
        });
      } catch (error) {
        console.warn('Map initialization failed:', error);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [delivery]);

  // Update rider marker when location changes
  useEffect(() => {
    if (!mapRef.current || !mapReady || !riderLocation) return;

    const { longitude, latitude } = riderLocation;

    if (!riderMarkerRef.current) {
      riderMarkerRef.current = new mapboxgl.Marker({ 
        color: '#3b82f6',
        rotation: riderLocation.heading || 0
      })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup().setText('Rider Location'))
        .addTo(mapRef.current);
    } else {
      riderMarkerRef.current.setLngLat([longitude, latitude]);
      if (riderLocation.heading) {
        riderMarkerRef.current.setRotation(riderLocation.heading);
      }
    }

    // Recalculate ETA if we have delivery destination
    if (delivery?.dropoff_lat && delivery?.dropoff_lng) {
      calculateETA(
        latitude,
        longitude,
        delivery.dropoff_lat,
        delivery.dropoff_lng,
        riderLocation.speed_kmh || 25
      ).then(setEstimatedMinutes);
    }
  }, [riderLocation, mapReady, delivery, calculateETA]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'picked_up': return 'bg-yellow-500';
      case 'in_transit': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'assigned': return 'Rider Assigned';
      case 'accepted': return 'Rider En Route to Pickup';
      case 'picked_up': return 'Order Picked Up';
      case 'in_transit': return 'On the Way to You';
      case 'delivered': return 'Delivered';
      default: return 'Pending';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Live Tracking
          </div>
          {isTracking && (
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`relative w-full ${heightClass} rounded-b-lg overflow-hidden border-t`}>
          <div ref={mapContainer} className="absolute inset-0" />
          
          {!mapReady && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Status overlay */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(delivery?.status)}`} />
                  <span className="text-sm font-medium">
                    {getStatusText(delivery?.status)}
                  </span>
                </div>
                {riderLocation && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-3 w-3" />
                    <span>
                      {new Date(riderLocation.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* ETA information */}
              {(estimatedMinutes || eta?.estimated_delivery_at) && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm">
                      {estimatedMinutes 
                        ? `ETA: ${estimatedMinutes} minutes`
                        : eta?.estimated_delivery_at 
                          ? `ETA: ${new Date(eta.estimated_delivery_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`
                          : 'Calculating ETA...'
                      }
                    </span>
                  </div>
                  
                  {riderLocation?.speed_kmh && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Moving at {Math.round(riderLocation.speed_kmh)} km/h
                    </div>
                  )}
                </div>
              )}

              {/* No tracking available */}
              {!riderLocation && isTracking && (
                <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Live tracking not available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}