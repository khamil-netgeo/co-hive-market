import { useState } from "react";
import SuperAdminLayout from "./SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setSEO } from "@/lib/seo";
import { useEffect } from "react";

// Import existing page components
import AdminDashboard from "../admin/Dashboard";
import Finance from "../admin/Finance";

export default function FinancialControl() {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setSEO(
      "Financial Control – Super Admin",
      "Monitor platform finances and administrative oversight."
    );
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Financial Control</h1>
          <p className="text-muted-foreground">Platform financial monitoring and administrative controls</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="overview" className="text-sm px-4 py-3">Admin Overview</TabsTrigger>
            <TabsTrigger value="finance" className="text-sm px-4 py-3">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="finance" className="mt-6">
            <Finance />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}