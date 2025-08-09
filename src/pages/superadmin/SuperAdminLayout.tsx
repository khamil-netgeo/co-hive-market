import { Outlet } from "react-router-dom";

const SuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container px-4 py-6 md:py-8">
      <section className="grid gap-4 md:gap-6">
        {children ?? <Outlet />}
      </section>
    </main>
  );
};

export default SuperAdminLayout;
