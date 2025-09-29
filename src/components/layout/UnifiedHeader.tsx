import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useAuthRoles from "@/hooks/useAuthRoles";
import useIsVendor from "@/hooks/useIsVendor";
import useIsRider from "@/hooks/useIsRider";
import { ShoppingCart, MessageSquare, LifeBuoy } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import CommunitySelector from "@/components/community/CommunitySelector";

interface UnifiedHeaderProps {
  showSidebarTrigger?: boolean;
  showNavigation?: boolean;
}

export default function UnifiedHeader({ showSidebarTrigger = false, showNavigation = false }: UnifiedHeaderProps) {
  const { user, isAdmin, isSuperadmin, signOut } = useAuthRoles();
  const { isVendor } = useIsVendor();
  const { isRider } = useIsRider();
  const navigate = useNavigate();
  const { count } = useCart();
  const initials = (user?.email?.[0] || "?").toUpperCase();
  const username = user?.email?.split('@')[0] || "";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between min-w-0" style={{paddingLeft: showSidebarTrigger ? '0.5rem' : '1rem', paddingRight: '1rem'}}>
        <div className="flex items-center gap-3 min-w-0">
          {showSidebarTrigger && <SidebarTrigger className="-ml-1 shrink-0" />}
          
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
            <span className="hidden sm:inline text-lg font-semibold text-gradient-brand">CoopMarket</span>
          </Link>
          
          {showNavigation && (
            <nav className="hidden gap-6 lg:flex ml-8">
              <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Products</Link>
              <Link to="/products?type=services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
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
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <ThemeToggle />
          
          {user && (
            <div className="hidden sm:block">
              <CommunitySelector />
            </div>
          )}
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/chat" aria-label="Chat with vendors" className="shrink-0">
              <MessageSquare className="h-5 w-5" />
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/support" aria-label="Support" className="shrink-0">
              <LifeBuoy className="h-5 w-5" />
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cart" aria-label={`Cart (${count} items)`} className="shrink-0">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="ml-1 text-xs">{count}</span>}
            </Link>
          </Button>
          
          {!user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" size="sm" asChild className="hidden sm:inline-flex"><Link to="/getting-started">Get Started</Link></Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 sm:gap-2 min-w-0">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm truncate max-w-[100px]">{username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Signed in as<br />{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Core navigation */}
                <DropdownMenuItem onSelect={() => navigate("/")}>Home</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/chat")}>Messages</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/support")}>Support</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/catalog")}>Catalog</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/feed")}>Shop Feed</DropdownMenuItem>
                
                {/* Role-based sections */}
                {(isVendor || isRider || isAdmin || isSuperadmin) && <DropdownMenuSeparator />}
                
                {isVendor && (
                  <DropdownMenuItem onSelect={() => navigate("/vendor/dashboard")}>Vendor Dashboard</DropdownMenuItem>
                )}
                
                {isRider && (
                  <DropdownMenuItem onSelect={() => navigate("/rider")}>Rider</DropdownMenuItem>
                )}
                
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