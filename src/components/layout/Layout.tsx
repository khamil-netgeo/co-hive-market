import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import AppTopbar from "./AppTopbar";
import AppSidebar from "./AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <AppTopbar />
          <main className="flex-1">
            {children ?? <Outlet />}
          </main>
          <SiteFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
