import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useAuthRoles from "@/hooks/useAuthRoles";
import useIsVendor from "@/hooks/useIsVendor";
import useIsRider from "@/hooks/useIsRider";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function AppTopbar() {
  const { user, isAdmin, isSuperadmin, signOut } = useAuthRoles();
  const { isVendor } = useIsVendor();
  const { isRider } = useIsRider();
  const navigate = useNavigate();
  const { count } = useCart();
  const initials = (user?.email?.[0] || "?").toUpperCase();
  const username = user?.email?.split('@')[0] || "";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <SidebarTrigger className="ml-0" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/cart" aria-label={`Cart (${count} items)`}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="ml-1 text-xs">{count}</span>}
            </Link>
          </Button>
          {!user ? (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" asChild><Link to="/getting-started">Get Started</Link></Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Signed in as<br />{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Core navigation - always available */}
                <DropdownMenuItem onSelect={() => navigate("/")}>Home</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/catalog")}>Catalog</DropdownMenuItem>
                
                {/* Role-based sections */}
                {(isVendor || isRider || isAdmin || isSuperadmin) && <DropdownMenuSeparator />}
                
                {isVendor && (
                  <DropdownMenuItem onSelect={() => navigate("/vendor/dashboard")}>Vendor Dashboard</DropdownMenuItem>
                )}
                
                {isRider && (
                  <DropdownMenuItem onSelect={() => navigate("/rider/dashboard")}>Rider Dashboard</DropdownMenuItem>
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
                <DropdownMenuItem onSelect={async () => { await signOut(); navigate("/"); }}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
