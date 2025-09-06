import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StandardDashboardLayout from "@/components/layout/StandardDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RiderStatusCard from "@/components/rider/RiderStatusCard";
import useIsRider from "@/hooks/useIsRider";
import { useDeliveryAssignments } from "@/hooks/useDeliveryAssignments";
import { Link } from "react-router-dom";
import useRiderLiveTracking from "@/hooks/useRiderLiveTracking";
import { Truck, Package, DollarSign, Clock } from "lucide-react";

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

  const riderStats = [
    {
      title: "Total Deliveries",
      value: stats.totalDeliveries.toString(),
      description: "Completed deliveries",
      icon: <Package className="h-4 w-4" />
    },
    {
      title: "Pending Assignments",
      value: stats.pendingAssignments.toString(),
      description: "Awaiting pickup",
      icon: <Clock className="h-4 w-4" />
    },
    {
      title: "Available Balance",
      value: formatCurrency(stats.availableBalance),
      description: "Ready for payout",
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: "Status",
      value: isRider ? "Active" : "Inactive",
      description: "Rider status",
      icon: <Truck className="h-4 w-4" />
    }
  ];

  const actions = (
    <div className="flex gap-2">
      <Button asChild>
        <Link to="/rider/assignments">View Assignments</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/rider/profile">Update Profile</Link>
      </Button>
    </div>
  );

  if (signedIn === false) {
    return (
      <StandardDashboardLayout title="Rider Dashboard" subtitle="Please sign in to access your rider dashboard">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to access the Rider Dashboard.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </StandardDashboardLayout>
    );
  }

  if (signedIn && !riderLoading && !isRider) {
    return (
      <StandardDashboardLayout title="Rider Dashboard" subtitle="Join as a rider to start delivering">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't joined as a rider yet. Join a community as a rider to start delivering.
            </p>
            <Button asChild>
              <Link to="/getting-started">Become a Rider</Link>
            </Button>
          </CardContent>
        </Card>
      </StandardDashboardLayout>
    );
  }

  return (
    <StandardDashboardLayout
      title="Rider Dashboard"
      subtitle="Monitor your deliveries and manage your rider activities"
      stats={riderStats}
      actions={actions}
    >
      {/* Status Overview */}
      <RiderStatusCard />

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
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
    </StandardDashboardLayout>
  );
};

export default RiderDashboard;