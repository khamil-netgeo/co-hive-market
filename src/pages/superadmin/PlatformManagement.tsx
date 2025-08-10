import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SuperAdminLayout from "./SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setSEO } from "@/lib/seo";
// Import existing page components
import UsersRoles from "./UsersRoles";
import GlobalSettings from "./GlobalSettings";
import FeatureFlags from "./FeatureFlags";
import Categories from "./Categories";

export default function PlatformManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "settings";
  const [activeTab, setActiveTab] = useState(initialTab);
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setSearchParams({ tab: v });
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="users" className="text-xs md:text-sm px-2 py-3">Users & Roles</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm px-2 py-3">Settings</TabsTrigger>
            <TabsTrigger value="features" className="text-xs md:text-sm px-2 py-3">Features</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs md:text-sm px-2 py-3">Categories</TabsTrigger>
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