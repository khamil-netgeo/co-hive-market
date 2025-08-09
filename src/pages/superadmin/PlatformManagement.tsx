import { useState } from "react";
import SuperAdminLayout from "./SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setSEO } from "@/lib/seo";
import { useEffect } from "react";

// Import existing page components
import UsersRoles from "./UsersRoles";
import GlobalSettings from "./GlobalSettings";
import FeatureFlags from "./FeatureFlags";
import Categories from "./Categories";

export default function PlatformManagement() {
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    setSEO(
      "Platform Management – Super Admin",
      "Manage users, settings, features, and categories across the platform."
    );
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Platform Management</h1>
          <p className="text-muted-foreground">Configure users, system settings, features, and content organization</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
            <TabsTrigger value="features">Feature Flags</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersRoles />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <GlobalSettings />
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <FeatureFlags />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Categories />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}