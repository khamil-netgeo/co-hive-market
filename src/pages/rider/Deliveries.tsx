import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiderNavigation from "@/components/rider/RiderNavigation";
import TripPanel from "@/components/rider/TripPanel";

interface ActiveDelivery {
  id: string;
  status: string;
  order_id: string;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  created_at: string;
}

const RiderDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Array<{ id: string; order_id: string; status: string; created_at: string }>>([]);
  const [active, setActive] = useState<ActiveDelivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO(
      "My Deliveries — CoopMarket",
      "Track your active deliveries and view delivery history."
    );
  }, []);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) return;

        // My deliveries list
        const { data, error } = await supabase
          .from("deliveries")
          .select("id, order_id, status, created_at")
          .eq("rider_user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setDeliveries((data as any[]) || []);

        // Active delivery (not yet delivered)
        const { data: act, error: aerr } = await supabase
          .from("deliveries")
          .select("id, order_id, status, created_at, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng")
          .eq("rider_user_id", user.id)
          .neq("status", "delivered")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (aerr) throw aerr;
        setActive((act as any) || null);
      } catch (e: any) {
        toast("Failed to load deliveries", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    loadDeliveries();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">My Deliveries</h1>
          <p className="mt-2 text-muted-foreground">
            Track your active deliveries and view your delivery history.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <RiderNavigation />
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* Active Trip */}
            {active && (
              <TripPanel delivery={active} />
            )}

            {/* Delivery History */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading your deliveries…</div>
                ) : deliveries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-sm text-muted-foreground mb-2">No deliveries assigned yet.</div>
                    <p className="text-xs text-muted-foreground">
                      Your delivery history will appear here once you start accepting assignments.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {deliveries.map((d) => (
                      <Card key={d.id} className="hover:shadow-elegant transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-base">Delivery #{d.id.slice(0, 8)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          <div>
                            Status: <span className="font-medium text-foreground capitalize">{d.status}</span>
                          </div>
                          <div className="mt-1">Order: {d.order_id.slice(0, 8)}…</div>
                          <div className="mt-1">Created: {new Date(d.created_at).toLocaleString()}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RiderDeliveries;