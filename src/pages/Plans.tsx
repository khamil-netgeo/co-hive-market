import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO(
      "Service Plans | CoopMarket",
      "Browse vendor service plans and subscribe securely using Stripe on CoopMarket."
    );
    const load = async () => {
      const { data, error } = await supabase
        .from("vendor_service_plans")
        .select("id,name,description,price_cents,currency,interval")
        .eq("status", "active")
        .order("name", { ascending: true });
      if (error) {
        toast("Failed to load plans", { description: error.message });
      } else {
        setPlans((data as any) || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const subscribe = async (plan: Plan) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Please sign in", { description: "You need an account to subscribe." });
        window.location.href = "/auth";
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          name: plan.name,
          amount_cents: plan.price_cents,
          currency: plan.currency,
          interval: plan.interval,
          success_path: "/payment-success",
          cancel_path: "/payment-canceled",
        },
      });
      if (error) throw error;
      window.open((data as any)?.url, "_blank");
    } catch (e: any) {
      toast("Subscription error", { description: e.message || String(e) });
    }
  };

  const fmtPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    if (currency.toLowerCase() === "myr") {
      return new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(amount);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
            <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
          </a>
          <div className="flex items-center gap-3">
            <Button variant="secondary" asChild>
              <a href="/">Home</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-12 md:py-16">
        <h1 className="text-3xl font-semibold">Service Plans</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Subscribe to vendor services. Cancel or manage anytime via the customer portal.
        </p>

        {loading ? (
          <div className="mt-8 text-muted-foreground">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="mt-8 rounded-md border bg-card p-6 text-muted-foreground">
            No plans yet. Vendors can create plans in their dashboard.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.id} className="hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {p.description && (
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <div className="text-2xl font-semibold">
                    {fmtPrice(p.price_cents, p.currency)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ {p.interval}</span>
                  </div>
                  <div>
                    <Button variant="hero" onClick={() => subscribe(p)}>Subscribe</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
