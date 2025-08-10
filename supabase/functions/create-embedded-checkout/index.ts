import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const origin = req.headers.get("origin") || "https://pxuqymgvmyuomafjgjuz.supabase.co";

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Auth is optional; attach email/customer when available
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(supabaseUrl, supabaseAnon);
    let userEmail: string | undefined;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email ?? undefined;
    }

    const body = await req.json().catch(() => ({}));
    const {
      name = "Cart purchase",
      amount_cents,
      currency = "usd",
      success_path = "/payment-success",
      product_id,
      vendor_id,
      community_id,
      delivery_method,
      scheduled_dropoff_at,
    } = body ?? {};

    if (!amount_cents || typeof amount_cents !== "number" || amount_cents <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount_cents" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Enforce Stripe currency minimums to avoid 500s from Stripe
    const cur = String(currency || "usd").toLowerCase();
    const minByCurrency: Record<string, number> = {
      myr: 200, // Stripe minimum RM2.00
      usd: 50,  // $0.50
      eur: 50,  // €0.50
      gbp: 30,  // £0.30
    };
    const minCents = minByCurrency[cur] ?? 50;
    if (Math.round(amount_cents) < minCents) {
      const human = cur.toUpperCase();
      return new Response(
        JSON.stringify({ error: `Minimum charge is ${human} ${(minCents / 100).toFixed(2)}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Try to reuse an existing customer
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: String(name) },
            unit_amount: Math.round(amount_cents),
          },
          quantity: 1,
        },
      ],
      return_url: `${origin}${success_path}?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        name: String(name),
        amount_cents: String(Math.round(amount_cents)),
        currency: String(currency),
        product_id: product_id ? String(product_id) : undefined,
        vendor_id: vendor_id ? String(vendor_id) : undefined,
        community_id: community_id ? String(community_id) : undefined,
        delivery_method: delivery_method ? String(delivery_method) : undefined,
        scheduled_dropoff_at: scheduled_dropoff_at ? String(scheduled_dropoff_at) : undefined,
      },
    });

    return new Response(JSON.stringify({ client_secret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
