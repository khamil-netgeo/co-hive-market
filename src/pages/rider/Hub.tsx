import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RiderStatusCard from "@/components/rider/RiderStatusCard";
import RiderProfileForm from "@/components/rider/RiderProfileForm";
import useIsRider from "@/hooks/useIsRider";
import { useDeliveryAssignments } from "@/hooks/useDeliveryAssignments";
import DeliveryAssignmentCard from "@/components/rider/DeliveryAssignmentCard";
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

const RiderHub = () => {
  const { isRider, loading: riderLoading } = useIsRider();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [deliveries, setDeliveries] = useState<Array<{ id: string; order_id: string; status: string; created_at: string }>>([]);
  const [active, setActive] = useState<ActiveDelivery | null>(null);
  const [loading, setLoading] = useState(true);

  const { assignments, loading: assigning, acceptAssignment, declineAssignment, refetch } = useDeliveryAssignments();

  useEffect(() => {
    setSEO(
      "Rider Hub — CoopMarket",
      "Manage your rider profile, go online, and view assigned deliveries."
    );
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        setSignedIn(!!user);
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
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Rider Hub</h1>
          <p className="mt-2 text-muted-foreground">
            View your status, update your profile, and manage deliveries.
          </p>
        </header>

        {signedIn === false && (
          <div className="flex flex-col items-start gap-3 rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Please sign in to access the Rider Hub.
            </p>
            <Button asChild>
              <a href="/auth">Sign in</a>
            </Button>
          </div>
        )}

        {signedIn && !riderLoading && !isRider && (
          <div className="mb-6 rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              You haven't joined as a rider yet. Join a community as a rider to start delivering.
            </p>
            <div className="mt-3">
              <Button variant="secondary" asChild>
                <a href="/getting-started">Become a Rider</a>
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <RiderStatusCard />
            <RiderProfileForm />
          </div>

          <aside className="lg:col-span-2 space-y-6">
            {/* New Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>New Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assigning ? (
                  <div className="text-sm text-muted-foreground">Checking for assignments…</div>
                ) : assignments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No new assignments right now.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {assignments.map((a) => (
                      <DeliveryAssignmentCard key={a.id} assignment={a} onAccept={async (id) => { await acceptAssignment(id); await refetch(); }} onDecline={declineAssignment} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Trip */}
            {active && (
              <TripPanel delivery={active} />
            )}

            {/* My Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>My Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading your deliveries…</div>
                ) : deliveries.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No deliveries assigned yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {deliveries.map((d) => (
                      <Card key={d.id} className="hover:shadow-elegant transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-base">Delivery #{d.id.slice(0, 8)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          <div>
                            Status: <span className="font-medium text-foreground">{d.status}</span>
                          </div>
                          <div className="mt-1">Order: {d.order_id}</div>
                          <div className="mt-1">Created: {new Date(d.created_at).toLocaleString()}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default RiderHub;
