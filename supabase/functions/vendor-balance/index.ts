import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anon = createClient(supabaseUrl, anonKey);
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr) throw userErr;
    const user = userData.user;
    if (!user) throw new Error("Unauthorized");

    // Fetch vendor accounts owned by this user
    const { data: vendorRows, error: vErr } = await service
      .from("vendors")
      .select("id")
      .eq("user_id", user.id);
    if (vErr) throw vErr;

    const vendorIds = (vendorRows || []).map((v: any) => v.id);
    if (vendorIds.length === 0) {
      return new Response(JSON.stringify({ vendors: [], available_cents: 0, pending_cents: 0, paid_cents: 0, total_earned_cents: 0, currency: "MYR" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Sum earnings from ledger_entries for these vendors
    const { data: ledgerSum, error: lErr } = await service
      .from("ledger_entries")
      .select("amount_cents")
      .eq("beneficiary_type", "vendor")
      .in("beneficiary_id", vendorIds);
    if (lErr) throw lErr;
    const totalEarned = (ledgerSum || []).reduce((acc: number, r: any) => acc + (r.amount_cents || 0), 0);

    // Payouts aggregation
    const { data: payoutsRows, error: pErr } = await service
      .from("payouts")
      .select("status, amount_cents")
      .in("vendor_id", vendorIds);
    if (pErr) throw pErr;

    let pending = 0;
    let paid = 0;
    (payoutsRows || []).forEach((r: any) => {
      if (r.status === "requested" || r.status === "approved") pending += r.amount_cents || 0;
      else if (r.status === "paid") paid += r.amount_cents || 0;
    });

    const available = Math.max(0, totalEarned - (pending + paid));

    // Determine currency from latest order (fallback to MYR)
    const { data: lastOrder, error: oErr } = await service
      .from("orders")
      .select("currency")
      .in("vendor_id", vendorIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (oErr && oErr.code !== "PGRST116") throw oErr; // ignore no rows

    const currency = (lastOrder?.currency || "myr").toUpperCase();

    return new Response(
      JSON.stringify({
        vendors: vendorIds,
        available_cents: available,
        pending_cents: pending,
        paid_cents: paid,
        total_earned_cents: totalEarned,
        currency,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("vendor-balance error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: message === "Unauthorized" ? 401 : 500,
    });
  }
});
