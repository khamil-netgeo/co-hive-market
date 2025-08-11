import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = new Resend(resendApiKey);

interface Payload {
  booking_id: string;
  send_to?: "both" | "buyer" | "vendor";
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toICSDateUTC(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function buildICS({ title, description, start, end, url }: { title: string; description?: string; start: Date; end: Date; url?: string; }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoopMarket//Service Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID?.() || `${Date.now()}@coopmarket`}`,
    `DTSTAMP:${toICSDateUTC(new Date())}`,
    `DTSTART:${toICSDateUTC(start)}`,
    `DTEND:${toICSDateUTC(end)}`,
    `SUMMARY:${esc(title)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${esc(description)}`);
  if (url) lines.push(`URL:${esc(url)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const jwt = req.headers.get("Authorization");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { booking_id, send_to = "both" } = (await req.json()) as Payload;
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Fetch booking
    const { data: booking, error: bErr } = await supabase
      .from("service_bookings")
      .select("id, service_id, vendor_id, buyer_user_id, scheduled_at, end_at, duration_minutes, status")
      .eq("id", booking_id)
      .maybeSingle();
    if (bErr || !booking) throw new Error(bErr?.message || "Booking not found");

    // Fetch service name
    const { data: svc } = await supabase
      .from("vendor_services")
      .select("name")
      .eq("id", booking.service_id)
      .maybeSingle();

    // Fetch vendor user id
    const { data: vendorRow } = await supabase
      .from("vendors")
      .select("user_id")
      .eq("id", booking.vendor_id)
      .maybeSingle();

    // Resolve emails via Admin API
    const buyerId = booking.buyer_user_id as string | undefined;
    const vendorUserId = vendorRow?.user_id as string | undefined;

    const [buyerUser, vendorUser] = await Promise.all([
      buyerId ? supabase.auth.admin.getUserById(buyerId) : Promise.resolve({ data: null } as any),
      vendorUserId ? supabase.auth.admin.getUserById(vendorUserId) : Promise.resolve({ data: null } as any),
    ]);

    const buyerEmail = buyerUser?.data?.user?.email as string | undefined;
    const vendorEmail = vendorUser?.data?.user?.email as string | undefined;

    const title = `Service: ${svc?.name || "Booking"}`;
    const start = booking.scheduled_at ? new Date(booking.scheduled_at) : new Date();
    const end = booking.end_at ? new Date(booking.end_at) : new Date(start.getTime() + ((booking.duration_minutes || 60) * 60 * 1000));
    const ics = buildICS({ title, description: "Booked via CoopMarket", start, end, url: `${new URL("/orders", supabaseUrl).toString()}` });

    const sendEmail = async (to?: string) => {
      if (!to) return;
      return await resend.emails.send({
        from: "CoopMarket <noreply@resend.dev>",
        to: [to],
        subject: `${title} — Calendar Invite`,
        html: `<p>Your booking is confirmed.</p><p><strong>${title}</strong><br/>Start: ${start.toUTCString()}<br/>End: ${end.toUTCString()}</p><p>Attached is an .ics calendar file.</p>`,
        attachments: [
          {
            filename: "booking.ics",
            content: btoa(ics),
          },
        ],
      });
    };

    const results: any = {};
    if (send_to === "both" || send_to === "buyer") results.buyer = await sendEmail(buyerEmail);
    if (send_to === "both" || send_to === "vendor") results.vendor = await sendEmail(vendorEmail);

    return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err: any) {
    console.error("send-service-invites error", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
