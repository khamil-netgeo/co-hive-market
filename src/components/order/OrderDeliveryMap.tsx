import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  delivery: {
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    dropoff_lat?: number | null;
    dropoff_lng?: number | null;
    rider_user_id?: string | null;
  } | null;
}

const OrderDeliveryMap: React.FC<Props> = ({ delivery }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const riderMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      if (!mapContainer.current) return;

      try {
        const { data, error } = await supabase.functions.invoke("mapbox-token");
        if (error) throw error;
        const token = (data && (data.token || data.access_token || data)) as string | undefined;
        if (!token) throw new Error("Missing Mapbox public token");
        (mapboxgl as any).accessToken = token;

        mapRef.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [101.6869, 3.139],
          zoom: 10,
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

        setReady(true);

        // Fit bounds to pickup & dropoff if available
        if (delivery?.pickup_lng != null && delivery?.pickup_lat != null && delivery?.dropoff_lng != null && delivery?.dropoff_lat != null) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([delivery.pickup_lng!, delivery.pickup_lat!]);
          bounds.extend([delivery.dropoff_lng!, delivery.dropoff_lat!]);
          mapRef.current.fitBounds(bounds, { padding: 60, animate: true });
        } else if (delivery?.pickup_lng != null && delivery?.pickup_lat != null) {
          mapRef.current.setCenter([delivery.pickup_lng!, delivery.pickup_lat!]);
          mapRef.current.setZoom(13);
        }

        // Add pickup and dropoff markers
        if (delivery?.pickup_lng != null && delivery?.pickup_lat != null) {
          new mapboxgl.Marker({ color: "#22c55e" })
            .setLngLat([delivery.pickup_lng!, delivery.pickup_lat!])
            .setPopup(new mapboxgl.Popup().setText("Pickup"))
            .addTo(mapRef.current);
        }
        if (delivery?.dropoff_lng != null && delivery?.dropoff_lat != null) {
          new mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([delivery.dropoff_lng!, delivery.dropoff_lat!])
            .setPopup(new mapboxgl.Popup().setText("Dropoff"))
            .addTo(mapRef.current);
        }

        // Subscribe to rider live location (best effort)
        if (delivery?.rider_user_id) {
          // Initial fetch
          const { data: rp } = await supabase
            .from("rider_profiles")
            .select("current_lat,current_lng")
            .eq("user_id", delivery.rider_user_id)
            .maybeSingle();

          if (rp?.current_lat && rp?.current_lng) {
            riderMarkerRef.current = new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([rp.current_lng, rp.current_lat])
              .setPopup(new mapboxgl.Popup().setText("Rider"))
              .addTo(mapRef.current);
          }

          // Realtime updates
          channel = supabase
            .channel(`rider-${delivery.rider_user_id}`)
            .on(
              "postgres_changes",
              { event: "UPDATE", schema: "public", table: "rider_profiles", filter: `user_id=eq.${delivery.rider_user_id}` },
              (payload) => {
                const nlng = (payload.new as any)?.current_lng;
                const nlat = (payload.new as any)?.current_lat;
                if (nlng != null && nlat != null) {
                  if (!riderMarkerRef.current) {
                    riderMarkerRef.current = new mapboxgl.Marker({ color: "#3b82f6" })
                      .setLngLat([nlng, nlat])
                      .setPopup(new mapboxgl.Popup().setText("Rider"))
                      .addTo(mapRef.current!);
                  } else {
                    riderMarkerRef.current.setLngLat([nlng, nlat]);
                  }
                }
              }
            )
            .subscribe();
        }
      } catch (e) {
        // Fail silently to avoid blocking the page
        console.warn("Map init failed", e);
      }
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (mapRef.current) mapRef.current.remove();
    };
  }, [delivery?.pickup_lat, delivery?.pickup_lng, delivery?.dropoff_lat, delivery?.dropoff_lng, delivery?.rider_user_id]);

  return (
    <div className="w-full h-80 rounded-md overflow-hidden border">
      <div ref={mapContainer} className="w-full h-full" />
      {!ready && (
        <div className="p-4 text-sm text-muted-foreground">Loading map…</div>
      )}
    </div>
  );
};

export default OrderDeliveryMap;
