import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import AppTopbar from "./AppTopbar";
import AppSidebar from "./AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CartProvider } from "@/hooks/useCart";
import { CommunityProvider } from "@/context/CommunityContext";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <CartProvider>
      <CommunityProvider>
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
      </CommunityProvider>
    </CartProvider>
  );
};

export default Layout;
