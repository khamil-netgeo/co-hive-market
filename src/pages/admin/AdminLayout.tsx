import { Outlet } from "react-router-dom";

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-muted-foreground">Platform administration and management</p>
      </header>
      <section className="grid gap-6">
        {children ?? <Outlet />}
      </section>
    </main>
  );
};

export default AdminLayout;
