import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock3, Users } from "lucide-react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Riders = () => {
  useEffect(() => {
    setSEO(
      "Become a Rider — CoopMarket",
      "Earn delivering for your community with fair payouts and flexible hours."
    );
  }, []);

  const [deliveries, setDeliveries] = useState<Array<{id:string; order_id:string; status:string; created_at:string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setLoading(false);
          return;
        }
        const riderId = sessionData.session.user.id;
        const { data, error } = await supabase
          .from("deliveries")
          .select("id, order_id, status, created_at")
          .eq("rider_user_id", riderId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setDeliveries((data as any[]) || []);
      } catch (e: any) {
        toast("Failed to load deliveries", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Become a Rider
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Flexible hours. Fair payouts. Real community impact.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <a href="/auth">Get Started</a>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="/#how">How it works</a>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Truck /> Fair payouts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Transparent earnings per delivery with community-aligned incentives.
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Clock3 /> Flexible schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Choose when to go online — fit deliveries around your life.
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Users /> Community impact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Every order shares profit with local communities and programs.
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold">My Deliveries</h2>
          {loading ? (
            <div className="mt-4 text-muted-foreground">Loading your deliveries…</div>
          ) : deliveries.length === 0 ? (
            <div className="mt-4 text-muted-foreground">No deliveries assigned yet. Sign in or check back later.</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {deliveries.map((d) => (
                <Card key={d.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Delivery #{d.id.slice(0, 8)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div>Status: <span className="font-medium text-foreground">{d.status}</span></div>
                    <div className="mt-1">Order: {d.order_id}</div>
                    <div className="mt-1">Created: {new Date(d.created_at).toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" asChild>
            <a href="/auth">Apply now</a>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Riders;
