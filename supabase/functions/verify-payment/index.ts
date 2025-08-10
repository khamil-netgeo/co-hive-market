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
    // Auth required for verifying and recording the order
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anon = createClient(supabaseUrl, supabaseAnon);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await anon.auth.getUser(token);
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read session_id from JSON body or query string
    const url = new URL(req.url);
    const qSession = url.searchParams.get("session_id");
    const body = await req.json().catch(() => ({} as any));
    const session_id = (body?.session_id as string | undefined) ?? qSession ?? body?.id;
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", status: session.payment_status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent duplicates
    const service = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: existing, error: existErr } = await service
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (existErr) throw existErr;
    if (existing) {
      return new Response(JSON.stringify({ order_id: existing.id, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract order context from metadata; fallback to product lookup when possible
    const md = (session.metadata || {}) as Record<string, string | undefined>;
    let vendor_id = md.vendor_id;
    let community_id = md.community_id;
    let amount_cents = md.amount_cents ? parseInt(md.amount_cents) : undefined;
    let currency = md.currency ?? undefined;

    if ((!vendor_id || !community_id || !amount_cents || !currency) && md.product_id) {
      const { data: product, error: pErr } = await service
        .from("products")
        .select("vendor_id, community_id, price_cents, currency")
        .eq("id", md.product_id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (product) {
        vendor_id = vendor_id || product.vendor_id;
        community_id = community_id || product.community_id;
        amount_cents = amount_cents || product.price_cents;
        currency = currency || product.currency;
      }
    }

    if (!vendor_id || !community_id || !amount_cents || !currency) {
      return new Response(
        JSON.stringify({ error: "Missing order context (vendor/community/amount/currency)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch buyer profile for shipping info (optional)
    const { data: prof } = await service
      .from("profiles")
      .select("address_line1,address_line2,city,state,postcode,country,phone,latitude,longitude")
      .eq("id", user.id)
      .maybeSingle();

    // Insert order securely using service role
    const { data: order, error: oErr } = await service
      .from("orders")
      .insert({
        buyer_user_id: user.id,
        vendor_id,
        community_id,
        total_amount_cents: Math.round(amount_cents),
        currency,
        stripe_session_id: session.id,
        recipient_name: null,
        recipient_phone: (prof as any)?.phone ?? null,
        ship_address_line1: (prof as any)?.address_line1 ?? null,
        ship_address_line2: (prof as any)?.address_line2 ?? null,
        ship_city: (prof as any)?.city ?? null,
        ship_state: (prof as any)?.state ?? null,
        ship_postcode: (prof as any)?.postcode ?? null,
        ship_country: (prof as any)?.country ?? 'MY',
        shipping_method: (md.delivery_method as any) ?? null,
      })
      .select("id, created_at, status, total_amount_cents, currency")
      .single();

    if (oErr) throw oErr;

    // Compute and record ledger splits (vendor/community/coop)
    const { data: communityCfg, error: cfgErr } = await service
      .from("communities")
      .select("coop_fee_percent, community_fee_percent")
      .eq("id", community_id as string)
      .maybeSingle();
    if (cfgErr) throw cfgErr;

    const total = order.total_amount_cents ?? Math.round(amount_cents!);
    const coopPct = communityCfg?.coop_fee_percent ?? 0;
    const communityPct = communityCfg?.community_fee_percent ?? 0;

    const coopShare = Math.max(0, Math.round((total * coopPct) / 100));
    const communityShare = Math.max(0, Math.round((total * communityPct) / 100));
    const vendorPayout = Math.max(0, total - coopShare - communityShare);

    const { error: ledgerErr } = await service.from("ledger_entries").insert([
      {
        order_id: order.id,
        entry_type: "vendor_payout",
        beneficiary_type: "vendor",
        beneficiary_id: vendor_id as string,
        amount_cents: vendorPayout,
        notes: `Vendor payout for order ${order.id}`,
      },
      {
        order_id: order.id,
        entry_type: "community_share",
        beneficiary_type: "community",
        beneficiary_id: community_id as string,
        amount_cents: communityShare,
        notes: `Community share for order ${order.id}`,
      },
      {
        order_id: order.id,
        entry_type: "coop_share",
        beneficiary_type: "coop",
        beneficiary_id: null,
        amount_cents: coopShare,
        notes: `Coop share for order ${order.id}`,
      },
    ]);
    if (ledgerErr) throw ledgerErr;

    // Mark order as paid and record initial progress events
    try {
      await service.from("orders").update({ status: "paid" }).eq("id", order.id);
      await service.from("order_progress_events").insert([
        {
          order_id: order.id,
          event: "order_paid",
          description: "Payment confirmed. Vendor notified to prepare.",
          created_by: user.id,
        },
      ]);
    } catch (e) {
      console.error("Failed to record initial order events:", e);
    }

    // Optional: Create delivery for rider method (food/groceries local delivery)
    const deliveryMethod = md.delivery_method;
    if (deliveryMethod === 'rider') {
      try {
        // Resolve pickup and dropoff coordinates
        let pickup_lat: number | null = null;
        let pickup_lng: number | null = null;
        if (md.product_id) {
          const { data: prod } = await service
            .from("products")
            .select("pickup_lat,pickup_lng")
            .eq("id", md.product_id)
            .maybeSingle();
          pickup_lat = (prod as any)?.pickup_lat ?? null;
          pickup_lng = (prod as any)?.pickup_lng ?? null;
        }

        const dropoff_lat = (prof as any)?.latitude ?? null;
        const dropoff_lng = (prof as any)?.longitude ?? null;
        const dropAddrParts = [
          (prof as any)?.address_line1,
          (prof as any)?.address_line2,
          (prof as any)?.city,
          (prof as any)?.state,
          (prof as any)?.postcode,
        ].filter(Boolean);
        const dropoff_address = dropAddrParts.join(", ");

        const scheduled_dropoff_at = md.scheduled_dropoff_at ? new Date(String(md.scheduled_dropoff_at)).toISOString() : null;

        const { data: delivery, error: dErr } = await service
          .from("deliveries")
          .insert({
            order_id: order.id,
            pickup_lat,
            pickup_lng,
            dropoff_lat,
            dropoff_lng,
            dropoff_address: dropoff_address || null,
            scheduled_dropoff_at: scheduled_dropoff_at as any,
            status: 'assigned',
          })
          .select("id,pickup_lat,pickup_lng")
          .single();
        if (dErr) throw dErr;

        if (delivery?.pickup_lat != null && delivery?.pickup_lng != null) {
          // Fan-out to nearby riders (don’t block the response)
          (globalThis as any).EdgeRuntime?.waitUntil?.(
            service.rpc('assign_delivery_to_riders', {
              delivery_id_param: delivery.id,
              pickup_lat: delivery.pickup_lat as number,
              pickup_lng: delivery.pickup_lng as number,
            })
          );
        }
      } catch (e) {
        console.error('Delivery creation failed:', e);
        // Continue without blocking order
      }
    }

    // Auto-book EasyParcel shipment for non-perishable items
    if (deliveryMethod === 'easyparcel') {
      try {
        const EP_API = Deno.env.get("EASYPARCEL_API_KEY")?.trim();
        if (!EP_API) {
          console.warn("EASYPARCEL_API_KEY not set; skipping EasyParcel booking");
        } else {
          // Load vendor pickup details
          const { data: vendor } = await service
            .from("vendors")
            .select(
              "display_name, pickup_address_line1, pickup_city, pickup_postcode, pickup_state, pickup_country, pickup_contact_name, pickup_phone"
            )
            .eq("id", vendor_id as string)
            .maybeSingle();

          // Shipping (recipient) details are in order and profile
          const send_address = order.ship_address_line1;
          const send_city = order.ship_city as string | null;
          const send_postcode = order.ship_postcode as string | null;

          const pick_address = (vendor as any)?.pickup_address_line1 as string | undefined;
          const pick_city = (vendor as any)?.pickup_city as string | undefined;
          const pick_postcode = (vendor as any)?.pickup_postcode as string | undefined;

          // Validate required fields
          if (!pick_address || !pick_city || !pick_postcode || !send_address || !send_city || !send_postcode) {
            console.warn("Missing pickup/delivery fields for EasyParcel; skipping booking", {
              pick_address: !!pick_address,
              pick_city: !!pick_city,
              pick_postcode: !!pick_postcode,
              send_address: !!send_address,
              send_city: !!send_city,
              send_postcode: !!send_postcode,
            });
          } else {
            // Estimate weight (kg). If unknown, default to 1kg.
            const weightKg = Math.max(1, Math.round(((md.total_weight_grams ? Number(md.total_weight_grams) : 1000) / 1000)));

            const bulkItem: Record<string, unknown> = {
              reference: order.id,
              content: `Order ${order.id}`,
              weight: weightKg,
              pick_name: (vendor as any)?.display_name || (vendor as any)?.pickup_contact_name || "Pickup",
              pick_contact: (vendor as any)?.pickup_phone || (vendor as any)?.pickup_contact_name || "",
              pick_address: pick_address,
              pick_city: pick_city,
              pick_state: (vendor as any)?.pickup_state || "",
              pick_postcode: pick_postcode,
              pick_country: (vendor as any)?.pickup_country || "MY",
              send_name: (session.customer_details as any)?.name || (order as any)?.recipient_name || user.email || "Customer",
              send_contact: (order as any)?.recipient_phone || (prof as any)?.phone || "",
              send_address: send_address,
              send_city: send_city,
              send_state: (order as any)?.ship_state || "",
              send_postcode: send_postcode,
              send_country: (order as any)?.ship_country || "MY",
            };

            const payload = { api: EP_API, bulk: [bulkItem] };
            const res = await fetch("https://api.easyparcel.my/?ac=EPOrderCreateBulk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const text = await res.text();
            let json: any;
            try { json = JSON.parse(text); } catch (_) { json = { raw: text }; }

            // Parse result
            const first = json?.result?.[0] || json?.data?.[0] || json?.[0] || null;
            const orderNo = first?.order_no ?? first?.order_number ?? null;
            const awbNo = first?.awb_no ?? first?.awb ?? null;

            if (orderNo || awbNo) {
              await service
                .from("orders")
                .update({ easyparcel_order_no: orderNo, easyparcel_awb_no: awbNo })
                .eq("id", order.id);
              await service.from("order_progress_events").insert({
                order_id: order.id,
                event: "shipment_booked",
                description: `EasyParcel booking created${awbNo ? `, AWB ${awbNo}` : ''}`,
                created_by: user.id,
                metadata: { provider: "easyparcel", order_no: orderNo, awb_no: awbNo },
              } as any);
            } else {
              console.warn("EasyParcel response did not include identifiers", json);
            }
          }
        }
      } catch (e) {
        console.error("EasyParcel booking failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ order, splits: { vendor_payout_cents: vendorPayout, community_share_cents: communityShare, coop_share_cents: coopShare } }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("verify-payment error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
