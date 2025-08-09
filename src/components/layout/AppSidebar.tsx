import { NavLink, useLocation, Link } from "react-router-dom";
import { ShoppingBag, Users, ListOrdered, Store, Shield } from "lucide-react";
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
import useAuthRoles from "@/hooks/useAuthRoles";

const items = [
  { title: "Catalog", url: "/catalog", icon: ShoppingBag },
  { title: "Services", url: "/services", icon: Store },
  { title: "Communities", url: "/communities", icon: Users },
  { title: "Orders", url: "/orders", icon: ListOrdered },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, isAdmin, isSuperadmin } = useAuthRoles();
  const currentPath = location.pathname;

  const vendorItem = user ? { title: "Vendor", url: "/vendor/dashboard", icon: Store } : null;
  const adminItem = (isAdmin || isSuperadmin) ? { title: "Admin", url: "/admin", icon: Shield } : null;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const allItems = [
    ...items,
    ...(vendorItem ? [vendorItem] : []),
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
      </SidebarContent>
    </Sidebar>
  );
}
