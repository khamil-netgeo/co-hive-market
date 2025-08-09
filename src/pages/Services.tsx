import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";

interface Service {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleById, setScheduleById] = useState<Record<string, string>>({}); // datetime-local values

  useEffect(() => {
    setSEO("Services | CoopMarket", "Book local services and pay securely.");
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("vendor_services")
          .select("id,vendor_id,name,description,price_cents,currency,status")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setServices(((data as any[]) || []).map((s) => ({
          id: s.id,
          vendor_id: s.vendor_id,
          name: s.name,
          description: s.description,
          price_cents: s.price_cents,
          currency: s.currency || "myr",
        })));
      } catch (e: any) {
        toast("Failed to load services", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (cents: number, currency: string) =>
    new Intl.NumberFormat(currency.toUpperCase() === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: currency.toUpperCase() }).format((cents || 0) / 100);

  const book = async (svc: Service) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to book services." });
        window.location.href = "/auth";
        return;
      }
      const buyerId = sessionData.session.user.id;
      const when = scheduleById[svc.id] ? new Date(scheduleById[svc.id]).toISOString() : null;
      // Create a booking row first
      const { data: bookingRows, error: bookingErr } = await supabase
        .from("service_bookings")
        .insert({ service_id: svc.id, buyer_user_id: buyerId, scheduled_at: when, total_amount_cents: svc.price_cents, currency: svc.currency })
        .select("id")
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      const bookingId = (bookingRows as any)?.id;

      // Start Stripe checkout via existing function
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Service: ${svc.name}`,
          amount_cents: svc.price_cents,
          currency: svc.currency || "myr",
          success_path: `/payment-success?booking_id=${bookingId}`,
          cancel_path: "/payment-canceled",
        },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.open(url, "_blank");
    } catch (e: any) {
      toast("Unable to book", { description: e.message || String(e) });
    }
  };

  return (
    <main className="container py-12 md:py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">Book community services and pay per visit.</p>

      {loading ? (
        <div className="mt-8 text-muted-foreground">Loading services…</div>
      ) : services.length === 0 ? (
        <div className="mt-8 rounded-md border bg-card p-6 text-muted-foreground">No services yet.</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card key={svc.id} className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle>{svc.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {svc.description && <p className="text-sm text-muted-foreground">{svc.description}</p>}
                <div className="text-2xl font-semibold">{fmt(svc.price_cents, svc.currency)}</div>
                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground" htmlFor={`dt-${svc.id}`}>Preferred date & time (optional)</label>
                  <Input id={`dt-${svc.id}`} type="datetime-local" value={scheduleById[svc.id] || ""} onChange={(e) => setScheduleById((m) => ({ ...m, [svc.id]: e.target.value }))} />
                </div>
                <div>
                  <Button variant="hero" onClick={() => book(svc)}>Book & Pay</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
