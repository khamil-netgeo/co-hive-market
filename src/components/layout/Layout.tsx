import { PropsWithChildren } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { Outlet } from "react-router-dom";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Layout;
