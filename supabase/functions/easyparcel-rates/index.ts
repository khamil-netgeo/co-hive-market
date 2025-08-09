import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateRequest {
  pick_postcode: string;
  pick_state?: string;
  pick_country?: string; // default MY
  send_postcode: string;
  send_state?: string;
  send_country?: string; // default MY
  weight: number; // kg
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  domestic?: boolean;
  cod?: boolean;
}

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
    const body = (await req.json()) as RateRequest;

    const payload = {
      api: API,
      bulk: [
        {
          pick_code: body.pick_postcode,
          pick_state: body.pick_state ?? "",
          pick_country: body.pick_country ?? "MY",
          send_code: body.send_postcode,
          send_state: body.send_state ?? "",
          send_country: body.send_country ?? "MY",
          weight: String(body.weight ?? 1),
          width: String(body.width ?? 0),
          length: String(body.length ?? 0),
          height: String(body.height ?? 0),
          domestic: body.domestic ? "1" : "0",
          cod: body.cod ? "1" : "0",
        },
      ],
    };

    const url = "https://api.easyparcel.my/?ac=EPRateCheckingBulk";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch (_) { json = { raw: text }; }

    // Attempt to normalize a friendly response
    const result = (json?.result ?? json?.rates ?? json) as any;

    return new Response(JSON.stringify({ ok: true, data: result }), {
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
