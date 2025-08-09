import { useEffect } from "react";
import { setSEO } from "@/lib/seo";

const Dashboard = () => {
  useEffect(() => {
    setSEO(
      "Admin Dashboard — CoopMarket",
      "Admin dashboard for managing marketplace data."
    );
  }, []);

  return (
    <section>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, admin. Use the navigation to manage the marketplace.
          </p>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
