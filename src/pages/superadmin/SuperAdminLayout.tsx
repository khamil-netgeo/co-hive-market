import { Outlet } from "react-router-dom";

const SuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container px-4 py-6 md:py-8">
      {/* Single H1 for SEO on superadmin pages should be inside each child page */}
      <section className="grid gap-4 md:gap-6">
        {children ?? <Outlet />}
      </section>
      <link rel="canonical" href={window.location.href} />
    </main>
  );
};

export default SuperAdminLayout;
