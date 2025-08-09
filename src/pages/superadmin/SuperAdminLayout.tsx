import { Outlet } from "react-router-dom";

const SuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container py-8">
      <section className="grid gap-6">
        {children ?? <Outlet />}
      </section>
    </main>
  );
};

export default SuperAdminLayout;
