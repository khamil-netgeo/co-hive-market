import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import useAuthRoles from "@/hooks/useAuthRoles";
import useIsVendor from "@/hooks/useIsVendor";
import useIsRider from "@/hooks/useIsRider";
import { ShoppingCart, MessageSquare, LifeBuoy, Sun, Moon, Users } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "next-themes";
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
  
  const { setTheme, resolvedTheme } = useTheme();
  const initials = (user?.email?.[0] || "?").toUpperCase();
  const username = user?.email?.split('@')[0] || "";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between min-w-0 w-full" style={{paddingLeft: showSidebarTrigger ? '0' : '1rem', paddingRight: '1rem'}}>
        <div className="flex items-center gap-3 min-w-0">
          {showSidebarTrigger && <SidebarTrigger className="shrink-0" />}
          
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
            <span className="hidden sm:inline text-lg font-semibold text-gradient-brand">CoopMarket</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 min-w-0">
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
                
                {/* App controls */}
                <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                  {resolvedTheme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Switch to Light
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Switch to Dark
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/chat")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/support")}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Support
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Core navigation */}
                <DropdownMenuItem onSelect={() => navigate("/")}>Home</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/orders")}>My Orders</DropdownMenuItem>
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