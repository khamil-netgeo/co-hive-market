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
    const headerOrigin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    let origin = headerOrigin || (referer ? new URL(referer).origin : "");
    if (!origin) origin = "https://pxuqymgvmyuomafjgjuz.supabase.co";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Try to get authenticated user (if available) to attach email/customer
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
      name = "One-Time Purchase",
      amount_cents,
      currency = "usd",
      success_path = "/payment-success",
      cancel_path = "/payment-canceled",
      product_id,
      vendor_id,
      community_id,
      // Optional delivery metadata
      delivery_method,
      scheduled_dropoff_at,
      // Optional service/booking metadata
      service_id,
      booking_id,
    } = body ?? {};

    if (!amount_cents || typeof amount_cents !== "number" || amount_cents <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount_cents" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // If user is known, try to find existing customer
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    // Build success/cancel URLs and ensure we append the session_id correctly
    const successUrl = `${origin}${success_path}${success_path.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${cancel_path}`;

    const session = await stripe.checkout.sessions.create({
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
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        name: String(name),
        amount_cents: String(Math.round(amount_cents)),
        currency: String(currency),
        product_id: product_id ? String(product_id) : undefined,
        vendor_id: vendor_id ? String(vendor_id) : undefined,
        community_id: community_id ? String(community_id) : undefined,
        delivery_method: delivery_method ? String(delivery_method) : undefined,
        scheduled_dropoff_at: scheduled_dropoff_at ? String(scheduled_dropoff_at) : undefined,
        service_id: service_id ? String(service_id) : undefined,
        booking_id: booking_id ? String(booking_id) : undefined,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
