import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Store, Truck, ChevronDown, User } from "lucide-react";
import useUserRoles from "@/hooks/useUserRoles";

type RoleType = 'buyer' | 'vendor' | 'delivery';

const roleConfig = {
  buyer: {
    icon: ShoppingCart,
    label: "Buyer Mode",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    routes: ['/products', '/orders', '/cart', '/catalog'],
    primaryAction: { label: "Browse Products", to: "/products" }
  },
  vendor: {
    icon: Store,
    label: "Vendor Mode", 
    color: "text-green-600",
    bgColor: "bg-green-100",
    routes: ['/vendor'],
    primaryAction: { label: "Vendor Dashboard", to: "/vendor/dashboard" }
  },
  delivery: {
    icon: Truck,
    label: "Rider Mode",
    color: "text-orange-600", 
    bgColor: "bg-orange-100",
    routes: ['/rider'],
    primaryAction: { label: "Rider Hub", to: "/rider" }
  }
};

interface RoleContextSwitcherProps {
  compact?: boolean;
}

export default function RoleContextSwitcher({ compact = false }: RoleContextSwitcherProps) {
  const { roles, loading } = useUserRoles();
  const location = useLocation();
  const [activeRole, setActiveRole] = useState<RoleType>('buyer');

  // Detect current role based on current route
  const detectActiveRole = (): RoleType => {
    const currentPath = location.pathname;
    
    if (currentPath.startsWith('/vendor')) return 'vendor';
    if (currentPath.startsWith('/rider')) return 'delivery'; 
    return 'buyer'; // default
  };

  const currentRole = detectActiveRole();
  const currentConfig = roleConfig[currentRole];
  const CurrentIcon = currentConfig.icon;

  // Get available roles for the user
  const availableRoles = Object.keys(roleConfig).filter(roleKey => 
    roles.some(role => role.member_type === roleKey)
  ) as RoleType[];

  if (loading || availableRoles.length <= 1) {
    return null; // Don't show if user has only one role or loading
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <CurrentIcon className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableRoles.map(roleKey => {
            const config = roleConfig[roleKey];
            const Icon = config.icon;
            const isActive = currentRole === roleKey;
            
            return (
              <DropdownMenuItem 
                key={roleKey} 
                asChild
                className={isActive ? "bg-muted" : ""}
              >
                <Link to={config.primaryAction.to} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                  {isActive && <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`p-1.5 rounded-md ${currentConfig.bgColor}`}>
          <CurrentIcon className={`h-4 w-4 ${currentConfig.color}`} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {currentConfig.label}
          </div>
          <div className="text-xs text-muted-foreground">
            {availableRoles.length} roles available
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Switch Role Context
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {availableRoles.map(roleKey => {
            const config = roleConfig[roleKey];
            const Icon = config.icon;
            const isActive = currentRole === roleKey;
            const roleCount = roles.filter(r => r.member_type === roleKey).length;
            
            return (
              <DropdownMenuItem 
                key={roleKey} 
                asChild
                className={isActive ? "bg-muted" : ""}
              >
                <Link to={config.primaryAction.to} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {roleCount} communit{roleCount === 1 ? 'y' : 'ies'}
                      </div>
                    </div>
                  </div>
                  {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                </Link>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Manage Roles
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}