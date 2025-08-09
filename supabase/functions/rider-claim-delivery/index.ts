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
    const assignment_id: string | undefined = body?.assignment_id;
    if (!assignment_id) {
      return new Response(JSON.stringify({ error: "assignment_id is required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    // Identify caller
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }
    const userId = userData.user.id;

    // Fetch assignment
    const { data: assignment, error: aErr } = await supabaseAdmin
      .from("delivery_assignments")
      .select("id, status, expires_at, delivery_id, rider_user_id")
      .eq("id", assignment_id)
      .single();
    if (aErr || !assignment) {
      return new Response(JSON.stringify({ error: "Assignment not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }

    if (assignment.rider_user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not your assignment" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    if (assignment.status !== "pending") {
      return new Response(JSON.stringify({ error: "Assignment is not pending" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const now = new Date();
    if (new Date(assignment.expires_at) <= now) {
      return new Response(JSON.stringify({ error: "Assignment expired" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Accept this assignment
    const { error: updErr } = await supabaseAdmin
      .from("delivery_assignments")
      .update({ status: "accepted", responded_at: now.toISOString() })
      .eq("id", assignment_id);
    if (updErr) throw updErr;

    // Expire other pending assignments for same delivery
    const { error: expErr } = await supabaseAdmin
      .from("delivery_assignments")
      .update({ status: "expired" })
      .eq("delivery_id", assignment.delivery_id)
      .neq("id", assignment_id)
      .eq("status", "pending");
    if (expErr) throw expErr;

    // Set rider on delivery and mark assigned
    const { error: delErr } = await supabaseAdmin
      .from("deliveries")
      .update({ rider_user_id: userId, assigned_at: now.toISOString(), status: "assigned" })
      .eq("id", assignment.delivery_id);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ ok: true, delivery_id: assignment.delivery_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});