import { Link, Outlet } from "react-router-dom";

const SuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Super Admin</h1>
        <nav className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/superadmin" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link to="/superadmin/users" className="hover:text-foreground transition-colors">Users & Roles</Link>
          <Link to="/superadmin/settings" className="hover:text-foreground transition-colors">Global Settings</Link>
          <Link to="/superadmin/feature-flags" className="hover:text-foreground transition-colors">Feature Flags</Link>
          <Link to="/superadmin/announcements" className="hover:text-foreground transition-colors">Announcements</Link>
          <Link to="/superadmin/reports" className="hover:text-foreground transition-colors">Content Reports</Link>
          <Link to="/superadmin/audit-logs" className="hover:text-foreground transition-colors">Audit Logs</Link>
        </nav>
      </header>
      <section className="grid gap-6">
        {children ?? <Outlet />}
      </section>
    </main>
  );
};

export default SuperAdminLayout;
