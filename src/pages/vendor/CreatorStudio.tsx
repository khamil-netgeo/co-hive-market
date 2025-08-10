import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VendorSubnav from "@/components/vendor/VendorSubnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";

interface Product { id: string; name: string; price_cents: number; currency: string; status: string; video_url?: string | null; image_urls?: string[] | null }
interface Service { id: string; name: string; price_cents: number; currency: string; status: string; video_url?: string | null; image_urls?: string[] | null }

export default function CreatorStudio() {
  const { user } = useAuthRoles();
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO("Creator Studio — Shoppable Clips | CoopMarket", "Upload short videos for your products and services.");
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) { navigate("/auth"); return; }
      try {
        const { data: vend, error: vErr } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (vErr) throw vErr;
        if (!vend) { toast("No vendor profile", { description: "Join as vendor to publish clips." }); navigate("/getting-started"); return; }
        const vid = (vend as any).id as string;
        setVendorId(vid);

        const [{ data: p, error: pErr }, { data: s, error: sErr }] = await Promise.all([
          supabase.from("products").select("id,name,price_cents,currency,status,video_url,image_urls").eq("vendor_id", vid).order("created_at", { ascending: false }),
          supabase.from("vendor_services").select("id,name,price_cents,currency,status,video_url,image_urls").eq("vendor_id", vid).order("created_at", { ascending: false }),
        ]);
        if (pErr) throw pErr; if (sErr) throw sErr;
        setProducts((p as any[]) || []);
        setServices((s as any[]) || []);
      } catch (e: any) {
        toast("Failed to load", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const withVideo = useMemo(() => ({
    products: products.filter(p => !!p.video_url),
    services: services.filter(s => !!s.video_url),
  }), [products, services]);

  const withoutVideo = useMemo(() => ({
    products: products.filter(p => !p.video_url),
    services: services.filter(s => !s.video_url),
  }), [products, services]);

  if (loading) return <div className="container px-4 py-8">Loading…</div>;
  if (!vendorId) return null;

  const CardRow = ({ title, items, type }: { title: string; items: (Product | Service)[]; type: "product" | "service" }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items here.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-md overflow-hidden">
                <div className="aspect-video bg-muted/40">
                  {/* Fallback to image if available */}
                  {item.video_url ? (
                    <video src={item.video_url} className="h-full w-full object-cover" muted playsInline />
                  ) : item.image_urls && item.image_urls[0] ? (
                    <img src={item.image_urls[0]} alt={`${item.name} preview`} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-sm font-medium line-clamp-1">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{(item.price_cents/100).toFixed(2)} {(item.currency || 'MYR').toUpperCase()}</div>
                  <div className="pt-2 flex gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link to={type === 'product' ? `/vendor/products/${item.id}/edit` : `/vendor/services/${item.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={type === 'product' ? `/product/${item.id}` : `/service/${item.id}`}>Preview</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-[60vh]">
      <VendorSubnav />
      <section className="container px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Creator Studio</h1>
            <p className="text-muted-foreground">Upload short videos to make your listings shoppable in the feed.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/vendor/products/new">Add Product</Link></Button>
            <Button asChild variant="outline"><Link to="/vendor/services/new">Add Service</Link></Button>
          </div>
        </div>

        <div className="grid gap-6">
          <CardRow title="Needs a video (Products)" items={withoutVideo.products} type="product" />
          <CardRow title="Needs a video (Services)" items={withoutVideo.services} type="service" />
          <CardRow title="With video (Products)" items={withVideo.products} type="product" />
          <CardRow title="With video (Services)" items={withVideo.services} type="service" />
        </div>
      </section>
    </main>
  );
}
