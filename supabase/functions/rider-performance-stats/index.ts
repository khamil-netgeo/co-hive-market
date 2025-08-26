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
    const { rider_user_id } = body;

    if (!rider_user_id) {
      return new Response(
        JSON.stringify({ error: "rider_user_id is required" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    // Get assignment statistics
    const { data: assignments, error: assignErr } = await supabaseAdmin
      .from("delivery_assignments")
      .select("id, created_at, responded_at, status")
      .eq("rider_user_id", rider_user_id)
      .order("created_at", { ascending: false });

    if (assignErr) throw assignErr;

    const total_assignments = assignments?.length || 0;
    const accepted_assignments = assignments?.filter(a => a.status === 'accepted') || [];
    const declined_assignments = assignments?.filter(a => a.status === 'declined') || [];
    const expired_assignments = assignments?.filter(a => a.status === 'expired') || [];

    const accepted_count = accepted_assignments.length;
    const declined_count = declined_assignments.length;
    const expired_count = expired_assignments.length;

    // Calculate response times for accepted assignments
    const response_times = accepted_assignments
      .filter(a => a.responded_at && a.created_at)
      .map(a => {
        const created = new Date(a.created_at).getTime();
        const responded = new Date(a.responded_at!).getTime();
        return responded - created;
      });

    const avg_response_time_ms = response_times.length > 0 
      ? response_times.reduce((sum, time) => sum + time, 0) / response_times.length
      : 0;

    const acceptance_rate = total_assignments > 0 
      ? (accepted_count / total_assignments) * 100 
      : 0;

    // Calculate current streak (consecutive acceptances from most recent)
    let current_streak = 0;
    for (const assignment of assignments || []) {
      if (assignment.status === 'accepted') {
        current_streak++;
      } else if (assignment.status === 'declined') {
        break;
      }
      // Skip expired assignments in streak calculation
    }

    // Get recent delivery performance
    const { data: deliveries, error: delErr } = await supabaseAdmin
      .from("deliveries")
      .select("id, status, assigned_at, created_at")
      .eq("rider_user_id", rider_user_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (delErr) throw delErr;

    const completed_deliveries = deliveries?.filter(d => d.status === 'delivered') || [];
    const total_deliveries = deliveries?.length || 0;

    // Calculate completion rate
    const completion_rate = total_deliveries > 0 
      ? (completed_deliveries.length / total_deliveries) * 100 
      : 0;

    // Get rating from rider profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("rider_profiles")
      .select("rating, total_deliveries")
      .eq("user_id", rider_user_id)
      .single();

    if (profileErr) {
      console.error("Error fetching rider profile:", profileErr);
    }

    const stats = {
      total_assignments,
      accepted_count,
      declined_count,
      expired_count,
      avg_response_time_ms: Math.round(avg_response_time_ms),
      acceptance_rate: Math.round(acceptance_rate * 100) / 100,
      current_streak,
      completion_rate: Math.round(completion_rate * 100) / 100,
      total_deliveries: profile?.total_deliveries || 0,
      current_rating: profile?.rating || 0,
      // Performance insights
      performance_insights: {
        response_speed: avg_response_time_ms < 30000 ? 'Fast' : avg_response_time_ms < 60000 ? 'Average' : 'Slow',
        reliability: acceptance_rate >= 80 ? 'High' : acceptance_rate >= 60 ? 'Medium' : 'Low',
        streak_status: current_streak >= 10 ? 'Hot Streak' : current_streak >= 5 ? 'Good Streak' : 'Building'
      }
    };

    return new Response(
      JSON.stringify(stats), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in rider-performance-stats:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});