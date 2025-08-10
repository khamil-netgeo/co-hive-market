import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import AppTopbar from "./AppTopbar";
import AppSidebar from "./AppSidebar";
import * as Sidebar from "@/components/ui/sidebar";
const Layout = ({ children }: PropsWithChildren) => {
  return (
    <Sidebar.SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <Sidebar.SidebarInset>
          <AppTopbar />
          <main className="flex-1">
            {children ?? <Outlet />}
          </main>
          <SiteFooter />
        </Sidebar.SidebarInset>
      </div>
    </Sidebar.SidebarProvider>
  );
};

export default Layout;
