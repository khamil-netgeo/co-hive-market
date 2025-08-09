import { Link, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  User, 
  DollarSign 
} from "lucide-react";

const RiderNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/rider", label: "Dashboard", icon: LayoutDashboard },
    { path: "/rider/assignments", label: "Assignments", icon: Package },
    { path: "/rider/deliveries", label: "Deliveries", icon: Truck },
    { path: "/rider/profile", label: "Profile", icon: User },
    { path: "/rider/payouts", label: "Payouts", icon: DollarSign },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <nav className="grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                asChild
                variant={isActive ? "default" : "ghost"}
                className="justify-start"
              >
                <Link to={item.path}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
};

export default RiderNavigation;