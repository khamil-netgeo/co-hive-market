import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RiderStatusCard from "@/components/rider/RiderStatusCard";
import RiderProfileForm from "@/components/rider/RiderProfileForm";
import useIsRider from "@/hooks/useIsRider";

const RiderHub = () => {
  const { isRider, loading: riderLoading } = useIsRider();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [deliveries, setDeliveries] = useState<Array<{ id: string; order_id: string; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

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
        const { data, error } = await supabase
          .from("deliveries")
          .select("id, order_id, status, created_at")
          .eq("rider_user_id", user.id)
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
