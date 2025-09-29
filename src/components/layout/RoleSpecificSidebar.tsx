import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShoppingCart, 
  Store, 
  Truck, 
  Home,
  Package,
  Users,
  Settings,
  BarChart3,
  Calendar,
  MapPin,
  CreditCard,
  Star,
  MessageSquare,
  FileText
} from "lucide-react";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import useUserRoles from "@/hooks/useUserRoles";

type RoleType = 'buyer' | 'vendor' | 'delivery';

interface RoleNavigationConfig {
  label: string;
  icon: typeof ShoppingCart;
  color: string;
  routes: Array<{
    title: string;
    url: string;
    icon: typeof Home;
    badge?: string;
  }>;
}

const roleNavigationConfig: Record<RoleType, RoleNavigationConfig> = {
  buyer: {
    label: "Buyer",
    icon: ShoppingCart,
    color: "text-blue-600",
    routes: [
      { title: "Browse Products", url: "/products", icon: Package },
      { title: "My Orders", url: "/orders", icon: ShoppingCart },
      { title: "Communities", url: "/communities", icon: Users },
      { title: "Cart", url: "/cart", icon: ShoppingCart },
      { title: "Reviews", url: "/reviews", icon: Star },
      { title: "Support", url: "/support", icon: MessageSquare }
    ]
  },
  vendor: {
    label: "Vendor",
    icon: Store,
    color: "text-green-600",
    routes: [
      { title: "Dashboard", url: "/vendor/dashboard", icon: Home },
      { title: "Products", url: "/vendor/products", icon: Package },
      { title: "Orders", url: "/vendor/orders", icon: ShoppingCart, badge: "new" },
      { title: "Analytics", url: "/vendor/analytics", icon: BarChart3 },
      { title: "Services", url: "/vendor/services", icon: Calendar },
      { title: "Payouts", url: "/vendor/payouts", icon: CreditCard },
      { title: "Reviews", url: "/vendor/reviews", icon: Star },
      { title: "Settings", url: "/vendor/settings", icon: Settings }
    ]
  },
  delivery: {
    label: "Rider",
    icon: Truck,
    color: "text-orange-600", 
    routes: [
      { title: "Hub", url: "/rider", icon: Home },
      { title: "Available Deliveries", url: "/rider/assignments", icon: MapPin, badge: "5" },
      { title: "My Deliveries", url: "/rider/deliveries", icon: Truck },
      { title: "Earnings", url: "/rider/payouts", icon: CreditCard },
      { title: "Performance", url: "/rider/dashboard", icon: BarChart3 },
      { title: "Support", url: "/support", icon: MessageSquare }
    ]
  }
};

interface RoleSpecificSidebarProps {
  currentRole?: RoleType;
}

export default function RoleSpecificSidebar({ currentRole }: RoleSpecificSidebarProps) {
  const location = useLocation();
  const { roles } = useUserRoles();
  
  // Auto-detect role based on current route if not specified
  const detectCurrentRole = (): RoleType => {
    if (currentRole) return currentRole;
    
    const path = location.pathname;
    if (path.startsWith('/vendor')) return 'vendor';
    if (path.startsWith('/rider')) return 'delivery';
    return 'buyer';
  };

  const activeRole = detectCurrentRole();
  const config = roleNavigationConfig[activeRole];
  const Icon = config.icon;

  // Check if user has this role
  const hasRole = roles.some(role => role.member_type === activeRole);

  if (!hasRole && activeRole !== 'buyer') {
    // Show getting started prompt for roles user doesn't have
    return (
      <Sidebar>
        <SidebarContent className="p-4">
          <div className="text-center space-y-4">
            <div className={`p-3 rounded-full bg-muted inline-flex`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-semibold">Join as {config.label}</h3>
              <p className="text-sm text-muted-foreground">
                Get started to access {config.label.toLowerCase()} features
              </p>
              <Link 
                to="/getting-started" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-brand-1 via-brand-2 to-brand-3 text-white shadow-lg">
              <div className="text-lg font-bold">CM</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">CoopMarket</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                  {config.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {roles.filter(r => r.member_type === activeRole).length} communities
                </div>
              </div>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {config.routes.map((route) => {
                const isActive = location.pathname === route.url || 
                  (route.url !== '/' && location.pathname.startsWith(route.url));
                const RouteIcon = route.icon;
                
                return (
                  <SidebarMenuItem key={route.url}>
                    <SidebarMenuButton 
                      asChild 
                      className={isActive ? "bg-primary/10 text-primary font-medium" : ""}
                    >
                      <Link to={route.url} className="flex items-center gap-3">
                        <RouteIcon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <span>{route.title}</span>
                          {route.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {route.badge}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/profile" className="flex items-center gap-3">
                    <Settings className="h-4 w-4" />
                    Manage Roles
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/communities" className="flex items-center gap-3">
                    <Users className="h-4 w-4" />
                    Browse Communities
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}