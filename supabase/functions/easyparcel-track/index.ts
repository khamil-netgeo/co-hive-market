import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/*
  Track shipment via EasyParcel. Accepts either `awb_no` or `order_no` fields (single or array).
  We'll call EPParcelStatusBulk and return the raw result for flexibility.
*/

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const API = Deno.env.get("EASYPARCEL_API_KEY")?.trim();
  if (!API) {
    return new Response(JSON.stringify({ error: "Missing EASYPARCEL_API_KEY" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    const body = await req.json();

    const bulk: any[] = [];
    if (Array.isArray(body?.awb_no)) {
      for (const a of body.awb_no) bulk.push({ awb_no: a });
    } else if (body?.awb_no) {
      bulk.push({ awb_no: body.awb_no });
    }

    if (Array.isArray(body?.order_no)) {
      for (const o of body.order_no) bulk.push({ order_no: o });
    } else if (body?.order_no) {
      bulk.push({ order_no: body.order_no });
    }

    if (bulk.length === 0) {
      return new Response(JSON.stringify({ error: "Provide awb_no or order_no" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const payload = { api: API, bulk };
    const url = "https://api.easyparcel.my/?ac=EPParcelStatusBulk";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch (_) { json = { raw: text }; }

    return new Response(JSON.stringify({ ok: true, data: json?.result ?? json }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
