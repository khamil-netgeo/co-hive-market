import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { ShoppingBag, Coffee, ShoppingCart, Briefcase, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const shopItems = [
  { title: "All Products", url: "/products", icon: ShoppingBag },
  { title: "Food & Dining", url: "/products?filter=prepared_food", icon: Coffee },
  { title: "Groceries", url: "/products?filter=grocery", icon: ShoppingCart },
  { title: "Services", url: "/products?type=services", icon: Briefcase },
  { title: "Shop Feed", url: "/feed", icon: Store },
];

export default function ShopSubnav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentPath = location.pathname;

  const getIsActive = (item: typeof shopItems[0]) => {
    if (item.url === "/feed") {
      return currentPath === "/feed";
    }
    
    if (currentPath === "/products") {
      const filter = searchParams.get('filter');
      const type = searchParams.get('type');
      
      if (item.url === "/products" && !filter && !type) return true;
      if (item.url.includes('filter=prepared_food') && filter === 'prepared_food') return true;
      if (item.url.includes('filter=grocery') && filter === 'grocery') return true;
      if (item.url.includes('type=services') && type === 'services') return true;
    }
    
    return false;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
      <div className="container px-4">
        <div className="flex items-center space-x-6 overflow-x-auto py-3">
          {shopItems.map((item) => {
            const isActive = getIsActive(item);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary",
                  isActive
                    ? "text-primary border-b-2 border-primary pb-3 -mb-3"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}