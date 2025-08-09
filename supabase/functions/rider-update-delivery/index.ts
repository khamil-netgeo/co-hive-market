import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const delivery_id: string | undefined = body?.delivery_id;
    const action: string | undefined = body?.action;
    if (!delivery_id || !action) {
      return new Response(JSON.stringify({ error: "delivery_id and action are required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }
    const userId = userData.user.id;

    const { data: delivery, error: dErr } = await supabaseAdmin
      .from("deliveries")
      .select("id, rider_user_id, status")
      .eq("id", delivery_id)
      .single();
    if (dErr || !delivery) {
      return new Response(JSON.stringify({ error: "Delivery not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }

    if (delivery.rider_user_id !== userId) {
      return new Response(JSON.stringify({ error: "You are not assigned to this delivery" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    const statusMap: Record<string, string> = {
      start_pickup: "en_route_pickup",
      picked_up: "picked_up",
      start_dropoff: "en_route_dropoff",
      delivered: "delivered",
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return new Response(JSON.stringify({ error: "Invalid action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const { data: updated, error: uErr } = await supabaseAdmin
      .from("deliveries")
      .update({ status: newStatus })
      .eq("id", delivery_id)
      .select("id, status")
      .single();
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ ok: true, delivery: updated }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});