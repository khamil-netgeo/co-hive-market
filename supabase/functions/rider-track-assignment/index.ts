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
    const { assignment_id, action, location, reason, timestamp } = body;

    if (!assignment_id || !action) {
      return new Response(
        JSON.stringify({ error: "assignment_id and action are required" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    // Verify user identity
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const userId = userData.user.id;

    // Verify assignment belongs to this rider
    const { data: assignment, error: aErr } = await supabaseAdmin
      .from("delivery_assignments")
      .select("id, rider_user_id, delivery_id, created_at")
      .eq("id", assignment_id)
      .eq("rider_user_id", userId)
      .single();

    if (aErr || !assignment) {
      return new Response(
        JSON.stringify({ error: "Assignment not found or not authorized" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Log the rider interaction
    const { error: logErr } = await supabaseAdmin
      .from("rider_assignment_logs")
      .insert({
        assignment_id: assignment_id,
        rider_user_id: userId,
        delivery_id: assignment.delivery_id,
        action: action,
        metadata: {
          location: location,
          reason: reason,
          timestamp: timestamp || new Date().toISOString(),
          user_agent: req.headers.get("user-agent"),
        }
      });

    if (logErr) {
      console.error("Failed to log rider interaction:", logErr);
    }

    // Update assignment with tracking data based on action
    if (action === 'viewed') {
      await supabaseAdmin
        .from("delivery_assignments")
        .update({ 
          viewed_at: timestamp || new Date().toISOString(),
          metadata: { 
            ...assignment.metadata,
            view_location: location,
            view_timestamp: timestamp || new Date().toISOString()
          }
        })
        .eq("id", assignment_id);
    }

    // If this is an acceptance, also log to order progress
    if (action === 'accepted') {
      const { error: progressErr } = await supabaseAdmin
        .from("order_progress_events")
        .insert({
          order_id: assignment.delivery_id, // Using delivery_id as order reference
          event_type: "rider_assigned",
          description: `Rider accepted delivery assignment`,
          metadata: {
            assignment_id: assignment_id,
            rider_user_id: userId,
            accepted_at: timestamp || new Date().toISOString(),
            location: location
          }
        });

      if (progressErr) {
        console.error("Failed to log progress event:", progressErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: action,
        logged_at: new Date().toISOString()
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in rider-track-assignment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});