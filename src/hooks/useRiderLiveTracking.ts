import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRiderProfile } from "./useRiderProfile";
import { useGeolocation } from "./useGeolocation";

// Simple haversine distance in meters
function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
  return R * c;
}

// Keeps rider profile location fresh while online
export default function useRiderLiveTracking() {
  const { profile, isOnline, updateLocation } = useRiderProfile();
  const {
    latitude,
    longitude,
    error,
    startWatching,
    stopWatching,
    isWatching,
  } = useGeolocation({ enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
  const lastSentAt = useRef<number>(0);
  const lastLat = useRef<number | null>(null);
  const lastLng = useRef<number | null>(null);

  // Start/stop geolocation based on online status
  useEffect(() => {
    if (!profile) return;
    if (isOnline && !isWatching) {
      startWatching();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      toast("Online — live tracking active", { description: "We’re sharing your location with nearby deliveries." });
    }
    if (!isOnline && isWatching) {
      stopWatching();
      toast("Offline", { description: "Location sharing paused." });
    }
  }, [profile, isOnline, isWatching, startWatching, stopWatching]);

  // Push updates when moved significantly or after a short interval
  useEffect(() => {
    if (!profile || !isOnline) return;
    if (error || latitude == null || longitude == null) return;

    const now = Date.now();
    const movedEnough =
      lastLat.current == null ||
      lastLng.current == null ||
      distanceMeters(lastLat.current, lastLng.current, latitude, longitude) > 30; // 30m threshold
    const timeElapsed = now - lastSentAt.current > 15000; // 15s

    if (movedEnough || timeElapsed) {
      updateLocation(latitude, longitude)
        .then(() => {
          lastSentAt.current = now;
          lastLat.current = latitude;
          lastLng.current = longitude;
        })
        .catch(() => {});
    }
  }, [latitude, longitude, error, profile, isOnline, updateLocation]);
}
