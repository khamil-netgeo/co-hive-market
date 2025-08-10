import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const delivery_id: string | undefined = body.delivery_id;
    if (!delivery_id) {
      return new Response(JSON.stringify({ error: "delivery_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch delivery and related order
    const { data: delivery, error: dErr } = await admin
      .from("deliveries")
      .select("id, order_id, rider_user_id, pickup_lat, pickup_lng, status")
      .eq("id", delivery_id)
      .maybeSingle();

    if (dErr) throw dErr;
    if (!delivery) {
      return new Response(JSON.stringify({ error: "Delivery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("id, buyer_user_id, vendor_id")
      .eq("id", delivery.order_id)
      .maybeSingle();
    if (oErr) throw oErr;
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Permission: buyer, vendor owner, admin/superadmin, or current rider
    let isAllowed = false;
    if (order.buyer_user_id === user.id || delivery.rider_user_id === user.id) {
      isAllowed = true;
    } else {
      // check vendor owner
      const { data: vendor, error: vErr } = await admin
        .from("vendors")
        .select("user_id")
        .eq("id", order.vendor_id)
        .maybeSingle();
      if (vErr) {
        // vendors table might not be accessible; ignore error
        console.warn("vendors lookup error", vErr);
      }
      if (vendor?.user_id === user.id) isAllowed = true;

      // check admin roles
      if (!isAllowed) {
        const { data: roles } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        if (roles?.some((r: any) => r.role === "admin" || r.role === "superadmin")) {
          isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (delivery.rider_user_id) {
      return new Response(
        JSON.stringify({ message: "Delivery already has a rider", rider_user_id: delivery.rider_user_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (delivery.pickup_lat == null || delivery.pickup_lng == null) {
      return new Response(JSON.stringify({ error: "Missing pickup coordinates on delivery" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if there are still valid pending assignments
    const nowIso = new Date().toISOString();
    const { data: pendingAssignments, error: aErr } = await admin
      .from("delivery_assignments")
      .select("id")
      .eq("delivery_id", delivery_id)
      .eq("status", "pending")
      .gt("expires_at", nowIso);
    if (aErr) throw aErr;

    if (pendingAssignments && pendingAssignments.length > 0) {
      return new Response(JSON.stringify({ message: "Already broadcasting to riders" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fan out to nearby riders again
    const { data: createdCount, error: rpcErr } = await admin.rpc(
      "assign_delivery_to_riders",
      {
        delivery_id_param: delivery_id,
        pickup_lat: delivery.pickup_lat,
        pickup_lng: delivery.pickup_lng,
      }
    );
    if (rpcErr) throw rpcErr;

    return new Response(
      JSON.stringify({ success: true, assignments_created: createdCount ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("rebroadcast-delivery error", e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
