import { PropsWithChildren } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import UnifiedHeader from "./UnifiedHeader";
import AppSidebar from "./AppSidebar";
import RoleSpecificSidebar from "./RoleSpecificSidebar";
import RoleBreadcrumbs from "@/components/navigation/RoleBreadcrumbs";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  
  // Determine if we should use role-specific sidebar
  const useRoleSpecificSidebar = 
    location.pathname.startsWith('/vendor') || 
    location.pathname.startsWith('/rider') ||
    location.pathname === '/products' ||
    location.pathname === '/orders' ||
    location.pathname === '/cart';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {useRoleSpecificSidebar ? <RoleSpecificSidebar /> : <AppSidebar />}
        <SidebarInset className="min-w-0 w-full overflow-x-hidden flex flex-col">
          <UnifiedHeader showSidebarTrigger />
          <RoleBreadcrumbs />
          <main className="flex-1 min-w-0 p-0" id="main-content">
            {children ?? <Outlet />}
          </main>
          <SiteFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;