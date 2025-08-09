import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

export type MapPickerValue = {
  latitude?: number | null;
  longitude?: number | null;
};

interface MapPickerProps {
  value?: MapPickerValue;
  onChange?: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [101.6869, 3.139]; // Kuala Lumpur, MY [lng, lat]

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, className }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!mapContainer.current || mapRef.current) return;

      // Get Mapbox token from Edge Function
      const { data, error } = await supabase.functions.invoke("mapbox-token");
      if (error || !data?.token) {
        console.error("Mapbox token error:", error || data);
        return;
      }
      mapboxgl.accessToken = data.token as string;

      const startLngLat: [number, number] = [
        value?.longitude ?? DEFAULT_CENTER[0],
        value?.latitude ?? DEFAULT_CENTER[1],
      ];

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: startLngLat,
        zoom: value?.latitude && value?.longitude ? 12 : 9,
        attributionControl: true,
      });
      mapRef.current = map;

      // Controls
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }));

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: true,
      });
      map.addControl(geolocate, "top-right");

      geolocate.on("geolocate", (e) => {
        const lngLat: [number, number] = [e.coords.longitude, e.coords.latitude];
        map.easeTo({ center: lngLat, zoom: 14, duration: 800 });
        placeMarker(lngLat);
        onChange?.({ latitude: lngLat[1], longitude: lngLat[0] });
      });

      function placeMarker(lngLat: [number, number]) {
        if (!mapRef.current) return;
        if (!markerRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "#2563eb" /* semantic-ish primary */ })
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          markerRef.current.setLngLat(lngLat);
        }
      }

      // Initialize marker if we have a value
      if (value?.latitude && value?.longitude) {
        placeMarker([value.longitude, value.latitude]);
      }

      map.on("click", (ev) => {
        const lngLat: [number, number] = [ev.lngLat.lng, ev.lngLat.lat];
        placeMarker(lngLat);
        onChange?.({ latitude: lngLat[1], longitude: lngLat[0] });
      });

      map.on("style.load", () => {
        // Subtle fog for depth
        try {
          (map as any).setFog?.({
            color: "rgb(255,255,255)",
            "high-color": "rgb(200,200,225)",
            "horizon-blend": 0.1,
          });
        } catch {}
      });
    }

    init();

    return () => {
      cancelled = true;
      if (markerRef.current) markerRef.current.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // If coordinates change from parent, update marker/center
  useEffect(() => {
    if (!mapRef.current) return;
    if (value?.latitude && value?.longitude) {
      const lngLat: [number, number] = [value.longitude, value.latitude];
      if (markerRef.current) {
        markerRef.current.setLngLat(lngLat);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: "#2563eb" }).setLngLat(lngLat).addTo(mapRef.current);
      }
      mapRef.current.easeTo({ center: lngLat, duration: 500 });
    }
  }, [value?.latitude, value?.longitude]);

  return (
    <div className={"relative w-full h-64 md:h-80 rounded-md overflow-hidden border " + (className ?? "")}> 
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
    </div>
  );
};

export default MapPicker;
