import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceAnalytics } from "@/components/service/ServiceAnalytics";
import { CommunicationSystem } from "@/components/service/CommunicationSystem";
import { BarChart3, MessageSquare, TrendingUp, Users } from "lucide-react";
import useAuthRoles from "@/hooks/useAuthRoles";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

const ServiceIntelligenceDashboard = () => {
  const { user, loading } = useAuthRoles();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(true);

  useEffect(() => {
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
        navigate("/getting-started");
        return;
      }

      setVendor(vendorData);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
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
            Business Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            Analytics and communication tools for your service business
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communication Hub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <ServiceAnalytics vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="communication">
          <CommunicationSystem vendorId={vendor.id} />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Overview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Performance Insights</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Track bookings, revenue, and customer satisfaction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">Smart Communication</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Automated messages and customer engagement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Customer Intelligence</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Understand behavior and improve retention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceIntelligenceDashboard;