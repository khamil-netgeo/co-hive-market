import { Link, Outlet } from "react-router-dom";

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/admin" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link to="/admin/finance" className="hover:text-foreground transition-colors">
            Finance
          </Link>
          <Link to="/admin/kyc" className="hover:text-foreground transition-colors">
            KYC
          </Link>
          <Link to="/admin/kyc-requirements" className="hover:text-foreground transition-colors">
            KYC Requirements
          </Link>
        </nav>
      </header>
      <section className="grid gap-6">
        {children ?? <Outlet />}
      </section>
    </main>
  );
};

export default AdminLayout;
