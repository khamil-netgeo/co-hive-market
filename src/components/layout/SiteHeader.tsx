import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import useAuthRoles from "@/hooks/useAuthRoles";
const SiteHeader = () => {
  const { isAdmin, isSuperadmin } = useAuthRoles();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
          <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Products</Link>
          <Link to="/plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
          <Link to="/riders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Community</Link>
          {(isAdmin || isSuperadmin) && (
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="hero" asChild><Link to="/auth">Get Started</Link></Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
