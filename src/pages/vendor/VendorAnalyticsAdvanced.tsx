import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useAuthRoles from "@/hooks/useAuthRoles";
import { useNavigate, Link } from "react-router-dom";
import { AdvancedAnalyticsDashboard } from "@/components/vendor/AdvancedAnalyticsDashboard";
import { ReturnManagement } from "@/components/returns/ReturnManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

const VendorAnalyticsAdvanced = () => {
  const { user, loading } = useAuthRoles();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(true);

  useEffect(() => {
    setSEO(
      "Advanced Analytics — CoopMarket",
      "Comprehensive analytics and business intelligence for vendors."
    );
    
    if (user && !loading) {
      fetchVendorData();
    }
  }, [user, loading]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;

      if (!vendorData) {
        toast.error("You don't have a vendor profile. Please join as a vendor first.");
        navigate("/getting-started");
        return;
      }

      setVendor(vendorData);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setLoadingVendor(false);
    }
  };

  if (loading || loadingVendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !vendor) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business intelligence and insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/vendor/analytics">Basic Analytics</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/vendor/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdvancedAnalyticsDashboard vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="returns">
          <ReturnManagement vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Advanced notification system coming soon. This will include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Email notifications for orders, payments, and reviews</li>
                  <li>SMS alerts for urgent matters</li>
                  <li>Push notifications for mobile app</li>
                  <li>Custom notification rules and filters</li>
                  <li>Notification analytics and delivery tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorAnalyticsAdvanced;