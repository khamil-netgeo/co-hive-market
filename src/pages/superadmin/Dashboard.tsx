import { useEffect } from "react";
import { setSEO } from "@/lib/seo";

const SuperAdminDashboard = () => {
  useEffect(() => {
    setSEO("Super Admin Dashboard — CoopMarket", "Global platform controls for super admins.");
  }, []);

  return (
    <section>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Access global settings, feature flags, user roles, moderation, and audit logs.
          </p>
        </article>
      </div>
    </section>
  );
};

export default SuperAdminDashboard;
