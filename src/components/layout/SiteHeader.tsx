import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SiteHeader = () => {
  const handleGetStarted = () => {
    toast("To enable accounts and roles, connect Supabase (top-right green button).", {
      description: "We’ll wire up Superadmin, Vendor, Delivery & Buyer once connected.",
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
          <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
        </a>
        <nav className="hidden gap-6 md:flex">
          <a href="/#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="/#roles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roles</a>
          <a href="/#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Categories</a>
          <a href="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Catalog</a>
          <a href="/plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</a>
          <a href="/riders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Riders</a>
          <a href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Orders</a>
          <a href="/vendor/plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor</a>
          <a href="/vendor/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vendor Orders</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <a href="/#learn">Learn more</a>
          </Button>
          <Button variant="hero" onClick={handleGetStarted}>Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
