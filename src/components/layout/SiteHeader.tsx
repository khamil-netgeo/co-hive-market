import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import useAuthRoles from "@/hooks/useAuthRoles";
import useIsRider from "@/hooks/useIsRider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const SiteHeader = () => {
  const { user, isAdmin, isSuperadmin, signOut } = useAuthRoles();
  const { isRider } = useIsRider();
  const navigate = useNavigate();

  const initials = (user?.email?.[0] || "?").toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
          <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Products</Link>
          <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
          <Link to="/communities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Communities</Link>
          {user ? (
            isRider ? (
              <Link to="/rider" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Rider</Link>
            ) : (
              <Link to="/riders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Become a Rider</Link>
            )
          ) : (
            <Link to="/riders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Riders</Link>
          )}
          <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Orders</Link>
          {user && (
            <Link to="/vendor/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor</Link>
          )}
          {(isAdmin || isSuperadmin) && (
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" asChild><Link to="/getting-started">Get Started</Link></Button>
            </>
          ) : (
            <>
              <Button variant="secondary" asChild><Link to="/getting-started">Get Started</Link></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Signed in as<br />{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/")}>Home</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/catalog")}>Catalog</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/vendor/dashboard")}>Vendor Dashboard</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/getting-started")}>Getting Started</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={async () => { await signOut(); navigate("/"); }}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
