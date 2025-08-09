import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  status: string;
}

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  status: string;
}

const FeaturedListings = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: prodData }, { data: svcData }] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,description,price_cents,currency,status")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("vendor_services")
            .select("id,name,description,price_cents,currency,status")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(4),
        ]);
        setProducts((prodData as any) || []);
        setServices((svcData as any) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (cents: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "USD").toUpperCase() }).format((cents || 0) / 100);

  return (
    <section className="container py-16 md:py-20">
      {/* Featured Products */}
      <div className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="mt-2 text-muted-foreground">Discover handpicked items from local vendors</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/catalog">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 grid-fade-in">
          {(loading ? Array.from({ length: 4 }) : products).map((p: any, index: number) => (
            <Card key={p?.id ?? index} className="group overflow-hidden border-0 shadow-md hover:shadow-elegant transition-all animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="relative overflow-hidden">
                <img
                  src={"/placeholder.svg"}
                  alt={(p?.name ? `${p.name} product image` : "Product placeholder")}
                  className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                />
                {!loading && <Badge className="absolute left-3 top-3 text-xs">New</Badge>}
                <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-8 w-8 bg-white/90 hover:bg-white">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{loading ? "Loading…" : p.name}</h3>
                {!loading && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{loading ? "" : fmt(p.price_cents, p.currency)}</span>
                  <Button size="sm" className="h-7 px-3 text-xs" asChild>
                    <Link to="/catalog">
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Services */}
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Popular Services</h2>
            <p className="mt-2 text-muted-foreground">Book trusted professionals in your area</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/services">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 grid-fade-in">
          {(loading ? Array.from({ length: 2 }) : services).map((s: any, index: number) => (
            <Card key={s?.id ?? index} className="group overflow-hidden border-0 shadow-md hover:shadow-elegant transition-all animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex">
                <img
                  src={"/placeholder.svg"}
                  alt={(s?.name ? `${s.name} service image` : "Service placeholder")}
                  className="h-32 w-32 object-cover transition-transform group-hover:scale-105"
                />
                <CardContent className="flex-1 p-4">
                  <h3 className="font-semibold mb-1">{loading ? "Loading…" : s.name}</h3>
                  {!loading && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{loading ? "" : fmt(s.price_cents, s.currency)}</span>
                    <Button size="sm" asChild>
                      <Link to="/services">Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;