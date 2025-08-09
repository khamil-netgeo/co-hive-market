import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/*
  This function proxies to EasyParcel EPOrderCreateBulk to create shipment(s).
  Request body must contain a `bulk` array with EasyParcel fields already mapped.
  We'll just inject the API key and forward as-is to reduce coupling.
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
    if (!body?.bulk || !Array.isArray(body.bulk) || body.bulk.length === 0) {
      return new Response(JSON.stringify({ error: "Body must include non-empty bulk array" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const payload = { api: API, bulk: body.bulk };
    const url = "https://api.easyparcel.my/?ac=EPOrderCreateBulk";

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
