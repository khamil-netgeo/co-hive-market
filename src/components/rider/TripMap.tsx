import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface TripMapProps {
  pickup?: { lat: number; lng: number; label?: string };
  dropoff?: { lat: number; lng: number; label?: string };
  heightClass?: string;
}

const TripMap = ({ pickup, dropoff, heightClass = 'h-64' }: TripMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!containerRef.current) return;
      // Fetch Mapbox public token from Edge Function
      const { data, error } = await supabase.functions.invoke('mapbox-token');
      if (error) return;
      const token = (data as any)?.token;
      if (!token) return;
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: pickup ? [pickup.lng, pickup.lat] : [101.6869, 3.139], // KL fallback
        zoom: pickup ? 12 : 10,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        if (cancelled) return;
        if (pickup) new mapboxgl.Marker({ color: '#16a34a' }).setLngLat([pickup.lng, pickup.lat]).setPopup(new mapboxgl.Popup().setText(pickup.label || 'Pickup')).addTo(map);
        if (dropoff) new mapboxgl.Marker({ color: '#ef4444' }).setLngLat([dropoff.lng, dropoff.lat]).setPopup(new mapboxgl.Popup().setText(dropoff.label || 'Dropoff')).addTo(map);

        // Fit bounds
        const points: [number, number][] = [];
        if (pickup) points.push([pickup.lng, pickup.lat]);
        if (dropoff) points.push([dropoff.lng, dropoff.lat]);
        if (points.length > 1) {
          const bounds = points.reduce((b, p) => b.extend(p as [number, number]), new mapboxgl.LngLatBounds(points[0], points[0]));
          map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
        }
      });
    };

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  return (
    <div className={`relative w-full ${heightClass} rounded-md overflow-hidden border`}> 
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/5" />
    </div>
  );
};

export default TripMap;
