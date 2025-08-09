import { useState } from "react";
import SuperAdminLayout from "./SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setSEO } from "@/lib/seo";
import { useEffect } from "react";

// Import existing page components
import Announcements from "./Announcements";
import ContentReports from "./ContentReports";

export default function Communications() {
  const [activeTab, setActiveTab] = useState("announcements");

  useEffect(() => {
    setSEO(
      "Communications – Super Admin",
      "Manage platform announcements and content moderation."
    );
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Communications</h1>
          <p className="text-muted-foreground">Platform announcements and content moderation</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="reports">Content Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-6">
            <Announcements />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ContentReports />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}