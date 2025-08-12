import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const body = req.method === 'POST' ? await req.json() : {};
    const session_id: string | undefined = body.session_id || new URL(req.url).searchParams.get('session_id') || undefined;
    if (!session_id) throw new Error('session_id is required');

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) throw new Error('Checkout session not found');

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ status: 'not_paid' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Use service role for DB writes
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const metadata = session.metadata || {} as Record<string, string>;
    const community_id = metadata["community_id"];
    const user_id = metadata["user_id"];
    const purpose = metadata["purpose"] || 'contribution';

    if (!community_id) throw new Error('Missing community_id in metadata');
    if (!user_id) throw new Error('Missing user_id in metadata');

    const amount_cents = typeof session.amount_total === 'number' ? session.amount_total : 0;
    const currency = (session.currency || 'myr').toLowerCase();

    if (purpose === 'membership') {
      const { error } = await supabaseService
        .from('community_membership_payments')
        .upsert({
          community_id,
          user_id,
          amount_cents,
          currency,
          stripe_session_id: session.id,
        }, { onConflict: 'stripe_session_id' });
      if (error) throw error;
    } else {
      const { error } = await supabaseService
        .from('community_fund_txns')
        .upsert({
          community_id,
          user_id,
          type: 'contribution',
          amount_cents,
          currency,
          stripe_session_id: session.id,
        }, { onConflict: 'stripe_session_id' });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ status: 'recorded' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
