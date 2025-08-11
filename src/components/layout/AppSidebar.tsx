import { NavLink, useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, Users, ListOrdered, Store, Shield, LayoutGrid, BarChart3, Briefcase, Wallet, ChevronDown, Package, Settings, Truck, DollarSign, User, Globe, UserCog, Flag, Megaphone, AlertTriangle, ScrollText, Coffee, ShoppingCart, MessageSquare, LifeBuoy, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import useAuthRoles from "@/hooks/useAuthRoles";
import useIsRider from "@/hooks/useIsRider";
import useIsVendor from "@/hooks/useIsVendor";

const items = [
  { title: "Communities", url: "/communities", icon: Users },
  { title: "Orders", url: "/orders", icon: ListOrdered },
  { title: "Messages", url: "/chat", icon: MessageSquare },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

const shopItems = [
  { title: "All Products", url: "/products", icon: ShoppingBag },
  { title: "Food & Dining", url: "/products?filter=prepared_food", icon: Coffee },
  { title: "Groceries", url: "/products?filter=grocery", icon: ShoppingCart },
  { title: "Services", url: "/products?type=services", icon: Briefcase },
  { title: "Shop Feed", url: "/feed", icon: Store },
];

const vendorItems = [
  { title: "Dashboard", url: "/vendor/dashboard", icon: LayoutGrid },
  { title: "Manage Listings", url: "/vendor/listings", icon: Package },
  { title: "Orders", url: "/vendor/orders", icon: ListOrdered },
  { title: "Analytics", url: "/vendor/analytics", icon: BarChart3 },
  { title: "Calendar", url: "/vendor/calendar", icon: Calendar },
  { title: "Payouts", url: "/vendor/payouts", icon: Wallet },
  { title: "Settings", url: "/vendor/settings", icon: Settings },
];

const riderItems = [
  { title: "Dashboard", url: "/rider", icon: LayoutGrid },
  { title: "Assignments", url: "/rider/assignments", icon: Package },
  { title: "Deliveries", url: "/rider/deliveries", icon: Truck },
  { title: "Profile", url: "/rider/profile", icon: User },
  { title: "Payouts", url: "/rider/payouts", icon: DollarSign },
];

const superAdminItems = [
  { title: "Overview", url: "/superadmin", icon: Globe },
  { title: "Platform Management", url: "/superadmin/platform", icon: Settings },
  { title: "Communications", url: "/superadmin/communications", icon: Megaphone },
  { title: "Financial Control", url: "/superadmin/finance", icon: DollarSign },
  { title: "Verification", url: "/superadmin/verification", icon: Shield },
  { title: "System Logs", url: "/superadmin/audit-logs", icon: ScrollText },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, isAdmin, isSuperadmin } = useAuthRoles();
  const currentPath = location.pathname;
  const { isRider } = useIsRider();
  const { isVendor } = useIsVendor();
  const searchParams = new URLSearchParams(location.search);

  const isVendorPath = currentPath.startsWith("/vendor");
  const isRiderPath = currentPath.startsWith("/rider");
  const isSuperAdminPath = currentPath.startsWith("/superadmin") || currentPath.startsWith("/admin");
  const isShopPath = currentPath.startsWith("/products") || currentPath.startsWith("/services") || currentPath.startsWith("/feed") || currentPath === "/catalog";

  // State to control which section is open (only one at a time)
  const [openSection, setOpenSection] = useState<'shop' | 'vendor' | 'rider' | 'superadmin' | null>(() => {
    if (isShopPath) return 'shop';
    if (isVendorPath) return 'vendor';
    if (isRiderPath) return 'rider';
    if (isSuperAdminPath) return 'superadmin';
    return null;
  });

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const allItems = [
    ...items,
  ];

  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-14" : "w-60"}>
      <SidebarHeader>
        <Link to="/" className="inline-flex items-center gap-2 p-2 hover:bg-accent/50 rounded-md transition-colors">
          <div className="h-7 w-7 rounded-md" style={{ background: 'var(--gradient-primary)' }} aria-hidden />
          {!collapsed && (
            <span className="text-lg font-semibold bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">
              CoopMarket
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Shop Section - Always visible */}
        <Collapsible open={openSection === 'shop'} onOpenChange={(open) => setOpenSection(open ? 'shop' : null)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between hover:bg-muted/50 px-2 py-1 rounded">
                {collapsed ? <ShoppingBag className="h-4 w-4" /> : <>Shop <ChevronDown className="h-4 w-4" /></>}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            {!collapsed && (
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {shopItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            className={({ isActive }) => {
                              // Custom active logic for shop items with query params
                              const isShopActive = currentPath === "/products" && (
                                (item.url === "/products" && !searchParams.get('filter') && !searchParams.get('type')) ||
                                (item.url.includes('filter=prepared_food') && searchParams.get('filter') === 'prepared_food') ||
                                (item.url.includes('filter=grocery') && searchParams.get('filter') === 'grocery') ||
                                (item.url.includes('type=services') && searchParams.get('type') === 'services')
                              );
                              const feedActive = currentPath === "/feed" && item.url === "/feed";
                              return getNavCls({ isActive: isShopActive || feedActive || isActive });
                            }}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </SidebarGroup>
        </Collapsible>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && isVendor && !collapsed && (
          <Collapsible open={openSection === 'vendor'} onOpenChange={(open) => setOpenSection(open ? 'vendor' : null)}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between hover:bg-muted/50 px-2 py-1 rounded">
                  Vendor
                  <ChevronDown className="h-4 w-4" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {vendorItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {user && isRider && !collapsed && (
          <Collapsible open={openSection === 'rider'} onOpenChange={(open) => setOpenSection(open ? 'rider' : null)}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between hover:bg-muted/50 px-2 py-1 rounded">
                  Rider
                  <ChevronDown className="h-4 w-4" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {riderItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {user && isSuperadmin && !collapsed && (
          <Collapsible open={openSection === 'superadmin'} onOpenChange={(open) => setOpenSection(open ? 'superadmin' : null)}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between hover:bg-muted/50 px-2 py-1 rounded">
                  Super Admin
                  <ChevronDown className="h-4 w-4" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {superAdminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

      </SidebarContent>
    </Sidebar>
  );
}
