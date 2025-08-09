import { Outlet } from "react-router-dom";

const SuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Super Admin</h1>
        <p className="text-muted-foreground">Global platform administration and controls</p>
      </header>
      <section className="grid gap-6">
        {children ?? <Outlet />}
      </section>
    </main>
  );
};

export default SuperAdminLayout;
