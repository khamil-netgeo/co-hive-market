import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RiderStatusCard from "@/components/rider/RiderStatusCard";
import useIsRider from "@/hooks/useIsRider";
import { useDeliveryAssignments } from "@/hooks/useDeliveryAssignments";
import { Link } from "react-router-dom";
import useRiderLiveTracking from "@/hooks/useRiderLiveTracking";

const RiderDashboard = () => {
  const { isRider, loading: riderLoading } = useIsRider();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingAssignments: 0,
    availableBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const { assignments } = useDeliveryAssignments();

  // Enable live tracking while online
  useRiderLiveTracking();

  useEffect(() => {
    setSEO(
      "Rider Dashboard — CoopMarket",
      "Overview of your rider activity and quick access to all rider features."
    );
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        setSignedIn(!!user);
        if (!user) return;

        // Load delivery count
        const { data: deliveries, error: dErr } = await supabase
          .from("deliveries")
          .select("id", { count: "exact" })
          .eq("rider_user_id", user.id);
        if (dErr) throw dErr;

        // Load balance
        let balance = 0;
        try {
          const { data: bal } = await supabase.functions.invoke("rider-balance");
          balance = bal?.available_cents || 0;
        } catch (e) {
          console.warn("Failed to load balance:", e);
        }

        setStats({
          totalDeliveries: deliveries?.length || 0,
          pendingAssignments: assignments.length,
          availableBalance: balance,
        });
      } catch (e: any) {
        toast("Failed to load dashboard", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [assignments]);

  const formatCurrency = (cents: number) => {
    try {
      return new Intl.NumberFormat(undefined, { 
        style: "currency", 
        currency: "MYR" 
      }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} MYR`;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Rider Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Here's your activity overview.
          </p>
        </header>

        {signedIn === false && (
          <div className="flex flex-col items-start gap-3 rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Please sign in to access the Rider Dashboard.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
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
                <Link to="/getting-started">Become a Rider</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Status Overview */}
          <RiderStatusCard />

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
                {stats.pendingAssignments > 0 && (
                  <Button asChild size="sm" className="mt-2">
                    <Link to="/rider/assignments">View Assignments</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.availableBalance)}</div>
                <Button asChild size="sm" className="mt-2" variant="outline">
                  <Link to="/rider/payouts">Manage Payouts</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button asChild>
                  <Link to="/rider/assignments">View Assignments</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/rider/deliveries">My Deliveries</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/rider/profile">Update Profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/rider/payouts">Request Payout</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default RiderDashboard;