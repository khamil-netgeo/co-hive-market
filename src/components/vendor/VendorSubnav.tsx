import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, ListOrdered, BarChart3, Briefcase, Wallet } from "lucide-react";

const links = [
  { to: "/vendor/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/vendor/orders", label: "Orders", icon: ListOrdered },
  { to: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/vendor/services", label: "Services", icon: Briefcase },
  { to: "/vendor/payouts", label: "Payouts", icon: Wallet },
];

export default function VendorSubnav() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <nav aria-label="Vendor navigation" className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {links.map((l) => {
            const Icon = l.icon;
            const active = isActive(l.to);
            return (
              <Button
                key={l.to}
                asChild
                variant={active ? "secondary" : "outline"}
                className={cn("shrink-0", active && "border-primary/30")}
              >
                <NavLink to={l.to} end>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{l.label}</span>
                </NavLink>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
