import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    const { data: u, error: uErr } = await supabaseUser.auth.getUser();
    if (uErr || !u.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    const userId = u.user.id;

    // Sum rider earnings from ledger
    const { data: earningsRows, error: eErr } = await supabaseAdmin
      .from("ledger_entries")
      .select("amount_cents")
      .eq("beneficiary_type", "rider")
      .eq("beneficiary_id", userId)
      .eq("entry_type", "rider_earning");
    if (eErr) throw eErr;
    const total_earned_cents = (earningsRows || []).reduce((acc, r: any) => acc + (r.amount_cents || 0), 0);

    // Pending and paid from rider_payouts
    const { data: pRows, error: pErr } = await supabaseAdmin
      .from("rider_payouts")
      .select("status, amount_cents")
      .eq("rider_user_id", userId);
    if (pErr) throw pErr;

    const pending_cents = (pRows || [])
      .filter((p: any) => p.status === "requested" || p.status === "approved")
      .reduce((acc: number, p: any) => acc + (p.amount_cents || 0), 0);

    const paid_cents = (pRows || [])
      .filter((p: any) => p.status === "paid")
      .reduce((acc: number, p: any) => acc + (p.amount_cents || 0), 0);

    const available_cents = Math.max(total_earned_cents - pending_cents - paid_cents, 0);

    // Determine currency from last order of this rider
    let currency = "MYR";
    const { data: lastDelivery, error: dErr } = await supabaseAdmin
      .from("deliveries")
      .select("order_id")
      .eq("rider_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!dErr && lastDelivery?.order_id) {
      const { data: o, error: oErr } = await supabaseAdmin
        .from("orders")
        .select("currency")
        .eq("id", lastDelivery.order_id)
        .maybeSingle();
      if (!oErr && o?.currency) currency = (o.currency as string).toUpperCase();
    }

    return new Response(
      JSON.stringify({ available_cents, pending_cents, paid_cents, total_earned_cents, currency }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e: any) {
    console.error("rider-balance error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});