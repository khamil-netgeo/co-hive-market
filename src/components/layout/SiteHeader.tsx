import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import useAuthRoles from "@/hooks/useAuthRoles";
import useIsRider from "@/hooks/useIsRider";
import useIsVendor from "@/hooks/useIsVendor";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, LifeBuoy } from "lucide-react";

const SiteHeader = () => {
  const { user, isAdmin, isSuperadmin, signOut } = useAuthRoles();
  const { isRider } = useIsRider();
  const { isVendor } = useIsVendor();
  const navigate = useNavigate();

  const initials = (user?.email?.[0] || "?").toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
          <span className="hidden sm:inline text-lg font-semibold text-gradient-brand">CoopMarket</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Products</Link>
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
          {isVendor && (
            <Link to="/vendor/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor</Link>
          )}
          {(isAdmin || isSuperadmin) && (
            <Link to={isSuperadmin ? "/superadmin" : "/admin"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isSuperadmin ? "Super Admin" : "Admin"}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/chat" aria-label="Chat with vendors">
              <MessageSquare className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/support" aria-label="Support">
              <LifeBuoy className="h-5 w-5" />
            </Link>
          </Button>
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
                    
                    {/* Core navigation - always available */}
                    <DropdownMenuItem onSelect={() => navigate("/")}>Home</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/products")}>Catalog</DropdownMenuItem>
                    
                    {/* Role-based sections */}
                    {(isVendor || isRider || isAdmin || isSuperadmin) && <DropdownMenuSeparator />}
                    
                    {isVendor && (
                      <DropdownMenuItem onSelect={() => navigate("/vendor/dashboard")}>Vendor Dashboard</DropdownMenuItem>
                    )}
                    
                    {isRider && (
                      <DropdownMenuItem onSelect={() => navigate("/rider")}>Rider</DropdownMenuItem>
                    )}
                    
                    {/* Show Admin for admin-only users, Super Admin for superadmin users */}
                    {(isAdmin || isSuperadmin) && (
                      <>
                        {isSuperadmin ? (
                          <DropdownMenuItem onSelect={() => navigate("/superadmin")}>Super Admin</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => navigate("/admin")}>Admin</DropdownMenuItem>
                        )}
                      </>
                    )}
                    
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
