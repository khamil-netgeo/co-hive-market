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

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or missing email");

    const body = await req.json();
    const community_id: string = body.community_id;
    const rawAmount: number | undefined = body.amount_cents;
    const purpose: string = body.purpose === 'membership' ? 'membership' : 'contribution';

    if (!community_id) throw new Error("community_id is required");

    // Fetch community details (publicly readable)
    const { data: community, error: cErr } = await supabaseAnon
      .from('communities')
      .select('id, name, membership_fee_cents')
      .eq('id', community_id)
      .maybeSingle();
    if (cErr) throw new Error(`Failed to load community: ${cErr.message}`);
    if (!community) throw new Error('Community not found');

    let amount_cents = rawAmount;
    if (purpose === 'membership') {
      amount_cents = community.membership_fee_cents ?? 0;
    }
    if (!amount_cents || amount_cents <= 0) {
      throw new Error('amount_cents must be > 0');
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    // Try to link to existing Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "https://" + (new URL(req.url)).host;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: { name: `${purpose === 'membership' ? 'Membership fee' : 'Contribution'} – ${community.name}` },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/community-payment-success?session_id={CHECKOUT_SESSION_ID}&community_id=${community.id}&purpose=${purpose}`,
      cancel_url: `${origin}/communities/${community.id}`,
      metadata: {
        community_id: community.id,
        purpose,
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
