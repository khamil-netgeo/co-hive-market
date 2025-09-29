import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store, Truck, Home, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type RoleType = 'buyer' | 'vendor' | 'delivery';

const roleConfig = {
  buyer: { icon: ShoppingCart, label: "Buyer", color: "bg-blue-100 text-blue-700" },
  vendor: { icon: Store, label: "Vendor", color: "bg-green-100 text-green-700" },
  delivery: { icon: Truck, label: "Rider", color: "bg-orange-100 text-orange-700" }
};

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/profile': 'Profile',
  '/products': 'Products',
  '/orders': 'Orders', 
  '/cart': 'Shopping Cart',
  '/communities': 'Communities',
  '/support': 'Support',
  '/getting-started': 'Getting Started',
  
  // Vendor routes
  '/vendor': 'Vendor Hub',
  '/vendor/dashboard': 'Dashboard',
  '/vendor/products': 'Products',
  '/vendor/products/new': 'New Product',
  '/vendor/orders': 'Orders',
  '/vendor/analytics': 'Analytics',
  '/vendor/services': 'Services',
  '/vendor/payouts': 'Payouts',
  '/vendor/settings': 'Settings',
  '/vendor/reviews': 'Reviews',
  
  // Rider routes
  '/rider': 'Rider Hub',
  '/rider/dashboard': 'Performance',
  '/rider/assignments': 'Available Deliveries',
  '/rider/deliveries': 'My Deliveries', 
  '/rider/payouts': 'Earnings'
};

export default function RoleBreadcrumbs() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  // Determine current role from path
  const getCurrentRole = (): RoleType => {
    if (currentPath.startsWith('/vendor')) return 'vendor';
    if (currentPath.startsWith('/rider')) return 'delivery';
    return 'buyer';
  };

  const currentRole = getCurrentRole();
  const RoleIcon = roleConfig[currentRole].icon;

  // Build breadcrumb path
  const buildBreadcrumbs = () => {
    const segments = currentPath.split('/').filter(Boolean);
    const crumbs = [];

    // Always start with Home
    crumbs.push({
      label: 'Home',
      href: '/',
      icon: Home
    });

    // Add role context if not on home page
    if (currentPath !== '/') {
      crumbs.push({
        label: roleConfig[currentRole].label,
        href: currentRole === 'buyer' ? '/products' : `/${currentRole === 'delivery' ? 'rider' : currentRole}`,
        icon: RoleIcon,
        role: currentRole
      });
    }

    // Build path segments
    let pathSoFar = '';
    segments.forEach((segment, index) => {
      pathSoFar += `/${segment}`;
      
      // Skip the role segment since we already added it
      if ((segment === 'vendor' || segment === 'rider') && index === 0) {
        return;
      }
      
      const label = routeLabels[pathSoFar] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Don't add duplicate entries
      if (!crumbs.some(crumb => crumb.href === pathSoFar)) {
        crumbs.push({
          label,
          href: pathSoFar
        });
      }
    });

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Don't show breadcrumbs on home page or mobile
  if (isMobile || currentPath === '/' || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/30">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const Icon = crumb.icon;
            
            return (
              <div key={crumb.href} className="flex items-center">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href} className="flex items-center gap-2 hover:text-foreground">
                        {Icon && <Icon className="h-4 w-4" />}
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto">
        <Badge variant="outline" className={`${roleConfig[currentRole].color} border-transparent`}>
          <RoleIcon className="h-3 w-3 mr-1" />
          {roleConfig[currentRole].label} Mode
        </Badge>
      </div>
    </div>
  );
}