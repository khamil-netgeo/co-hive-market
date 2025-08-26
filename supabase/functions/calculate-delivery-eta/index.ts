import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ETACalculationRequest {
  order_id: string;
  rider_user_id: string;
  current_lat: number;
  current_lng: number;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat: number;
  dropoff_lng: number;
  average_speed_kmh?: number;
  traffic_factor?: number;
}

// Haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Simple traffic factor calculation based on time of day
function getTrafficFactor(): number {
  const now = new Date();
  const hour = now.getHours();
  
  // Peak hours: 7-9 AM and 5-7 PM
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.5; // 50% longer due to traffic
  }
  
  // Moderate traffic: 10 AM - 4 PM
  if (hour >= 10 && hour <= 16) {
    return 1.2; // 20% longer
  }
  
  // Light traffic: early morning, evening, night
  return 1.0; // No additional time
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ETACalculationRequest = await req.json();
    const {
      order_id,
      rider_user_id,
      current_lat,
      current_lng,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      average_speed_kmh = 25, // Default urban delivery speed
      traffic_factor
    } = body;

    if (!order_id || !rider_user_id || !current_lat || !current_lng || !dropoff_lat || !dropoff_lng) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Calculate distances and times
    let distanceToPickupKm = 0;
    let estimatedPickupAt: Date | null = null;
    
    // If pickup coordinates are provided, calculate pickup ETA
    if (pickup_lat && pickup_lng) {
      distanceToPickupKm = calculateDistance(current_lat, current_lng, pickup_lat, pickup_lng);
      const pickupTimeMinutes = (distanceToPickupKm / average_speed_kmh) * 60;
      estimatedPickupAt = new Date(Date.now() + pickupTimeMinutes * 60 * 1000);
    }

    // Calculate delivery distance and ETA
    const startLat = pickup_lat || current_lat;
    const startLng = pickup_lng || current_lng;
    const distanceToDeliveryKm = calculateDistance(startLat, startLng, dropoff_lat, dropoff_lng);
    
    // Apply traffic factor
    const finalTrafficFactor = traffic_factor || getTrafficFactor();
    const deliveryTimeMinutes = (distanceToDeliveryKm / average_speed_kmh) * 60 * finalTrafficFactor;
    
    // Calculate final delivery ETA
    const baseTime = estimatedPickupAt ? estimatedPickupAt.getTime() : Date.now();
    const estimatedDeliveryAt = new Date(baseTime + deliveryTimeMinutes * 60 * 1000);

    // Save or update ETA in database
    const etaData = {
      order_id,
      rider_user_id,
      estimated_pickup_at: estimatedPickupAt?.toISOString(),
      estimated_delivery_at: estimatedDeliveryAt.toISOString(),
      distance_to_pickup_km: distanceToPickupKm,
      distance_to_delivery_km: distanceToDeliveryKm,
      traffic_factor: finalTrafficFactor,
      updated_at: new Date().toISOString(),
    };

    // Try to update existing ETA first
    const { data: existingEta, error: fetchError } = await supabase
      .from("delivery_etas")
      .select("id")
      .eq("order_id", order_id)
      .eq("rider_user_id", rider_user_id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let result;
    if (existingEta) {
      // Update existing ETA
      const { data, error } = await supabase
        .from("delivery_etas")
        .update(etaData)
        .eq("id", existingEta.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new ETA
      const { data, error } = await supabase
        .from("delivery_etas")
        .insert(etaData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    // Also log rider location snapshot for this order
    await supabase
      .from("rider_location_snapshots")
      .insert({
        rider_user_id,
        order_id,
        latitude: current_lat,
        longitude: current_lng,
        metadata: {
          calculation_type: 'eta_update',
          distance_to_pickup_km: distanceToPickupKm,
          distance_to_delivery_km: distanceToDeliveryKm,
          traffic_factor: finalTrafficFactor,
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        eta: result,
        calculation_details: {
          distance_to_pickup_km: distanceToPickupKm,
          distance_to_delivery_km: distanceToDeliveryKm,
          traffic_factor: finalTrafficFactor,
          estimated_pickup_minutes: estimatedPickupAt ? Math.round((estimatedPickupAt.getTime() - Date.now()) / 60000) : null,
          estimated_delivery_minutes: Math.round((estimatedDeliveryAt.getTime() - Date.now()) / 60000),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error calculating ETA:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});