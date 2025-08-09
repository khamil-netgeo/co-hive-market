import { NavLink, useLocation, Link } from "react-router-dom";
import { ShoppingBag, Users, ListOrdered, Store, Shield, LayoutGrid, BarChart3, Briefcase, Wallet, ChevronDown, Package } from "lucide-react";
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

const items = [
  { title: "Catalog", url: "/catalog", icon: ShoppingBag },
  { title: "Services", url: "/services", icon: Store },
  { title: "Communities", url: "/communities", icon: Users },
  { title: "Orders", url: "/orders", icon: ListOrdered },
];

const vendorItems = [
  { title: "Overview", url: "/vendor/dashboard", icon: LayoutGrid },
  { title: "Products", url: "/catalog", icon: Package },
  { title: "Orders", url: "/vendor/orders", icon: ListOrdered },
  { title: "Analytics", url: "/vendor/analytics", icon: BarChart3 },
  { title: "Services", url: "/vendor/services", icon: Briefcase },
  { title: "Payouts", url: "/vendor/payouts", icon: Wallet },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, isAdmin, isSuperadmin } = useAuthRoles();
  const currentPath = location.pathname;

  const adminItem = (isAdmin || isSuperadmin) ? { title: "Admin", url: "/admin", icon: Shield } : null;
  const isVendorPath = currentPath.startsWith("/vendor");

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const allItems = [
    ...items,
    ...(adminItem ? [adminItem] : []),
  ];

  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-14" : "w-60"}>
      <SidebarHeader>
        <Link to="/" className="inline-flex items-center gap-2 p-2">
          <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
          {!collapsed && <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
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

        {user && !collapsed && (
          <Collapsible defaultOpen={isVendorPath}>
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
      </SidebarContent>
    </Sidebar>
  );
}
