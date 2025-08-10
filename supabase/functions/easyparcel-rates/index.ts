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

    const mapMsState = (s?: string): string | undefined => {
      if (!s) return undefined;
      const key = s.toLowerCase();
      const map: Record<string, string> = {
        'selangor': 'sgr', 'kuala lumpur': 'kul', 'wilayah persekutuan kuala lumpur': 'kul',
        'penang': 'png', 'pulau pinang': 'png', 'johor': 'jhr', 'perak': 'prk', 'pahang': 'phg',
        'kelantan': 'klt', 'terengganu': 'trg', 'negeri sembilan': 'nsn', 'melaka': 'mlk', 'malacca': 'mlk',
        'kedah': 'kdh', 'perlis': 'pls', 'sabah': 'sbh', 'sarawak': 'swk', 'labuan': 'lbn', 'putrajaya': 'pjy'
      };
      // accept already-coded values
      if (Object.values(map).includes(key)) return key;
      return map[key] ?? s;
    };

    const payload = {
      api: API,
      bulk: [
        {
          pick_code: body.pick_postcode,
          pick_state: mapMsState(body.pick_state) ?? "",
          pick_country: body.pick_country ?? "MY",
          send_code: body.send_postcode,
          send_state: mapMsState(body.send_state) ?? "",
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

    const url = "https://connect.easyparcel.my/?ac=EPRateCheckingBulk";

    // Build URL-encoded form body like PHP http_build_query
    const params = new URLSearchParams();
    const appendForm = (prefix: string, value: any) => {
      if (Array.isArray(value)) {
        value.forEach((v, i) => appendForm(`${prefix}[${i}]`, v));
      } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) {
          appendForm(`${prefix}[${k}]`, v);
        }
      } else if (value !== undefined && value !== null) {
        params.append(prefix, String(value));
      }
    };

    appendForm("api", API);
    appendForm("bulk", payload.bulk);
    appendForm("exclude_fields", ["rates.*.pickup_point", "rates.*.dropoff_point"]);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch (_) {
      if (text && text.includes("<html")) {
        throw new Error("EasyParcel upstream returned HTML (likely Cloudflare/DNS). Please try again later.");
      }
      json = { raw: text };
    }

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
