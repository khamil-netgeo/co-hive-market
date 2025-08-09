import { useState } from "react";
import SuperAdminLayout from "./SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setSEO } from "@/lib/seo";
import { useEffect } from "react";

// Import existing page components
import KYC from "../admin/KYC";
import KYCRequirements from "../admin/KYCRequirements";

export default function Verification() {
  const [activeTab, setActiveTab] = useState("submissions");

  useEffect(() => {
    setSEO(
      "Verification – Super Admin",
      "Manage KYC submissions and verification requirements."
    );
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Verification</h1>
          <p className="text-muted-foreground">User verification and KYC management</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="submissions" className="text-sm px-4 py-3">KYC Submissions</TabsTrigger>
            <TabsTrigger value="requirements" className="text-sm px-4 py-3">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            <KYC />
          </TabsContent>

          <TabsContent value="requirements" className="mt-6">
            <KYCRequirements />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}