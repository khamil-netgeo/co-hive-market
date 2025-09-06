import { useEffect } from "react";
import { setSEO } from "@/lib/seo";
import StandardDashboardLayout from "@/components/layout/StandardDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, ShoppingBag, FileText, DollarSign } from "lucide-react";

const Dashboard = () => {
  useEffect(() => {
    setSEO(
      "Admin Dashboard — CoopMarket",
      "Admin dashboard for managing marketplace data."
    );
  }, []);

  const adminStats = [
    {
      title: "Total Users",
      value: "1,234",
      description: "Active marketplace users",
      trend: "+12% from last month",
      icon: <Users className="h-4 w-4" />
    },
    {
      title: "Total Products",
      value: "567",
      description: "Listed products",
      trend: "+5% from last month",
      icon: <ShoppingBag className="h-4 w-4" />
    },
    {
      title: "Orders",
      value: "89",
      description: "This month",
      trend: "+23% from last month",
      icon: <FileText className="h-4 w-4" />
    },
    {
      title: "Revenue",
      value: "$12,345",
      description: "Total revenue",
      trend: "+18% from last month",
      icon: <DollarSign className="h-4 w-4" />
    }
  ];

  const actions = (
    <div className="flex gap-2">
      <Button asChild>
        <Link to="/admin/kyc">Manage KYC</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/admin/finance">View Finance</Link>
      </Button>
    </div>
  );

  return (
    <StandardDashboardLayout
      title="Admin Dashboard"
      subtitle="Manage marketplace operations and monitor system health"
      stats={adminStats}
      actions={actions}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/admin/kyc">Review KYC Applications</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/admin/finance">Financial Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">System Status</h3>
            <p className="text-sm text-muted-foreground">
              All systems are running smoothly. Use the navigation to access detailed management tools.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Monitor user activity and system events through the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    </StandardDashboardLayout>
  );
};

export default Dashboard;
