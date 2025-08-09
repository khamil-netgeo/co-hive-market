import { useEffect, useState } from "react";
import heroImage from "@/assets/coop-hero.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Users,
  Store,
  Truck,
  ShoppingBag,
  Sparkles,
  GraduationCap,
  Wrench,
  Clock3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  useEffect(() => {
    document.title = "CoopMarket — Community-Powered Marketplace";
  }, []);

  const [subStatus, setSubStatus] = useState<null | {
    subscribed: boolean;
    subscription_tier?: string | null;
    subscription_end?: string | null;
  }>(null);

  const handleGetStarted = () => {
    toast("To enable accounts and roles, connect Supabase (top-right green button).", {
      description: "We’ll wire up Superadmin, Vendor, Delivery & Buyer once connected.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
            <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
          </a>
          <nav className="hidden gap-6 md:flex">
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#roles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roles</a>
            <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Categories</a>
            <a href="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Catalog</a>
            <a href="/plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plans</a>
            <a href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Orders</a>
            <a href="/vendor/plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor</a>
            <a href="/vendor/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor Orders</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <a href="#learn">Learn more</a>
            </Button>
            <Button variant="hero" onClick={handleGetStarted}>Get Started</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-primary animate-gradient-shift opacity-30" aria-hidden />
          <div className="container grid grid-cols-1 items-center gap-10 py-16 md:grid-cols-2 md:py-24">
            <div>
              <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Community‑Powered Marketplace for Products, Services, Time & Learning
              </h1>
              <p className="mt-4 max-w-prose text-lg text-muted-foreground">
                Join a cooperative where every transaction strengthens your local community.
                Vendors, riders, and buyers all benefit — and a main cooperative helps fund new growth.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="hero" size="lg" onClick={handleGetStarted}>
                  Launch Your Community
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> Profit sharing to communities</li>
                <li className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Roles: Superadmin, Vendor, Delivery, Buyer</li>
                <li className="inline-flex items-center gap-2"><Wrench className="h-4 w-4" /> Programs to boost demand & revenue</li>
                <li className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Events & education beyond commerce</li>
              </ul>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Illustration of a cooperative marketplace connecting vendors, riders and buyers"
                className="mx-auto aspect-video w-full max-w-xl rounded-xl border bg-card object-cover shadow-elegant"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="container py-12 md:py-16">
          <h2 className="text-3xl font-semibold">Stakeholders</h2>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Each member is attached to a community — aligning incentives and sharing profits fairly.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><Store /> Vendor</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sell products or services. Create offers and programs with your community to grow.
              </CardContent>
            </Card>
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><Truck /> Delivery</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Earn by fulfilling local deliveries while contributing to community revenue.
              </CardContent>
            </Card>
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><ShoppingBag /> Buyer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Discover products, services, events, and courses — your purchase empowers your community.
              </CardContent>
            </Card>
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><Users /> Superadmin</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Govern the main cooperative, collect small monthly dues, and seed new initiatives.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="relative border-y py-12 md:py-16">
          <div className="container">
            <h2 className="text-3xl font-semibold">How it works</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>1. Join a Community</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Vendors, buyers, and riders attach to a local community that shares in every transaction.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>2. Trade & Contribute</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Product sales, bookings, time-based gigs, and learning all generate community profit.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>3. Grow Together</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  The main cooperative collects a small due to fund programs and new business growth.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="container py-12 md:py-16">
          <h2 className="text-3xl font-semibold">One platform — four ways to earn</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><ShoppingBag /> Product</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Physical or digital goods with local fulfillment or shipping.</CardContent>
            </Card>
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><Wrench /> Service</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Bookable services from professionals and community members.</CardContent>
            </Card>
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><Clock3 /> Time</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Time-based gigs and appointments — earn by the hour or slot.</CardContent>
            </Card>
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-xl"><GraduationCap /> Learning</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Courses and events that bring people together beyond commerce.</CardContent>
            </Card>
          </div>

          <div className="mt-10">
            <Button variant="hero" size="lg" onClick={handleGetStarted}>Start Your Community</Button>
          </div>
        </section>

        {/* Payments & Subscriptions demo */}
        <section className="container py-12 md:py-16">
          <h2 className="text-3xl font-semibold">Payments & Subscriptions (MYR)</h2>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Try a one-off payment or start a subscription. Subscriptions require an account.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>One-off purchase</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <p>RM 49.90 — Demo product</p>
                <Button
                  variant="hero"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("create-payment", {
                        body: {
                          name: "Demo Product",
                          amount_cents: 4990,
                          currency: "myr",
                          success_path: "/payment-success",
                          cancel_path: "/payment-canceled",
                        },
                      });
                      if (error) throw error;
                      window.open((data as any)?.url, "_blank");
                    } catch (e: any) {
                      toast("Checkout error", { description: e.message || String(e) });
                    }
                  }}
                >
                  Pay RM 49.90
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <p>RM 19.90 / month — Premium plan</p>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("create-checkout", {
                        body: {
                          name: "Premium Subscription",
                          amount_cents: 1990,
                          currency: "myr",
                          interval: "month",
                          success_path: "/payment-success",
                          cancel_path: "/payment-canceled",
                        },
                      });
                      if (error) throw error;
                      window.open((data as any)?.url, "_blank");
                    } catch (e: any) {
                      toast("Subscription error", { description: e.message || String(e) });
                    }
                  }}
                >
                  Subscribe RM 19.90/mo
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("customer-portal");
                      if (error) throw error;
                      window.open((data as any)?.url, "_blank");
                    } catch (e: any) {
                      toast("Portal error", { description: e.message || String(e) });
                    }
                  }}
                >
                  Manage subscription
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription status</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <Button
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("check-subscription");
                      if (error) throw error;
                      setSubStatus(data as any);
                      toast("Status updated", { description: JSON.stringify(data) });
                    } catch (e: any) {
                      toast("Check failed", { description: e.message || String(e) });
                    }
                  }}
                >
                  Refresh status
                </Button>
                <div className="rounded-md border bg-card p-3">
                  {subStatus ? (
                    <ul className="space-y-1 text-foreground">
                      <li>
                        <strong>Active:</strong> {subStatus.subscribed ? "Yes" : "No"}
                      </li>
                      {subStatus.subscription_tier && (
                        <li>
                          <strong>Tier:</strong> {subStatus.subscription_tier}
                        </li>
                      )}
                      {subStatus.subscription_end && (
                        <li>
                          <strong>Ends:</strong> {new Date(subStatus.subscription_end).toLocaleString()}
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p>No data yet. Use “Refresh status”.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CoopMarket — Community-Powered Marketplace</p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Terms</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
