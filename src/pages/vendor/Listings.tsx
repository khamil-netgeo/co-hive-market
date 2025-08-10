import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import MediaGallery from "@/components/common/MediaGallery";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  status: string;
  created_at: string;
  image_urls?: string[] | null;
}

interface Service {
  id: string;
  name: string;
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  status: string;
  created_at: string;
  image_urls?: string[] | null;
}

export default function VendorListings() {
  const { user } = useAuthRoles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const tab = searchParams.get("type") || "all"; // all | products | services

  useEffect(() => {
    setSEO("Vendor Listings — Manage products and services", "Manage all your listings in one place");
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;
        const { data: vend, error: vErr } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (vErr) throw vErr;
        if (!vend) {
          toast("Vendor profile not found", { description: "Please complete vendor onboarding." });
          return;
        }
        setVendorId((vend as any).id);

        const [{ data: pData, error: pErr }, { data: sData, error: sErr }] = await Promise.all([
          supabase.from("products").select("*").eq("vendor_id", (vend as any).id).order("created_at", { ascending: false }),
          supabase.from("vendor_services").select("id,name,subtitle,description,price_cents,currency,status,created_at,image_urls").eq("vendor_id", (vend as any).id).order("created_at", { ascending: false }),
        ]);
        if (pErr) throw pErr;
        if (sErr) throw sErr;
        setProducts((pData as any) || []);
        setServices((sData as any) || []);
      } catch (e: any) {
        console.error(e);
        toast("Failed to load listings", { description: e?.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("type"); else params.set("type", next);
    setSearchParams(params, { replace: true });
  };

  const fmt = (cents: number, currency: string) => new Intl.NumberFormat("en-MY", { style: "currency", currency: (currency||"MYR").toUpperCase() }).format((cents||0)/100);

  const visibleProducts = useMemo(() => products, [products]);
  const visibleServices = useMemo(() => services, [services]);

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", productId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
      toast.success(`Product ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch (e: any) {
      toast("Failed to update status", { description: e?.message || String(e) });
    }
  };

  if (loading) {
    return (
      <main className="container py-8">
        <p>Loading listings…</p>
      </main>
    );
  }

  return (
    <main className="container py-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Vendor Listings</h1>
          <p className="text-muted-foreground">Manage products and services from one place</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild>
            <Link to="/vendor/products/new"><Plus className="h-4 w-4 mr-2"/>Add product</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/vendor/services/new"><Plus className="h-4 w-4 mr-2"/>Add service</Link>
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          <section aria-labelledby="products-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="products-heading" className="text-lg font-semibold">Products</h2>
              <Button variant="link" asChild><Link to="?type=products">View all</Link></Button>
            </div>
            {visibleProducts.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No products yet.</CardContent></Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProducts.slice(0,6).map((p) => (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="aspect-video">
                      <MediaGallery images={p.image_urls || []} videos={[]} alt={p.name} aspect="video" showThumbnails={false} />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base truncate">{p.name}</CardTitle>
                        <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                      </div>
                      <CardDescription className="truncate">{p.description || '—'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="font-semibold">{fmt(p.price_cents, p.currency)}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/vendor/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleProductStatus(p.id, p.status)}>
                          {p.status === 'active' ? <><EyeOff className="h-4 w-4"/></> : <><Eye className="h-4 w-4"/></>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="services-heading" className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 id="services-heading" className="text-lg font-semibold">Services</h2>
              <Button variant="link" asChild><Link to="?type=services">View all</Link></Button>
            </div>
            {visibleServices.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No services yet.</CardContent></Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleServices.slice(0,6).map((s) => (
                  <Card key={s.id} className="overflow-hidden">
                    <div className="aspect-video">
                      <MediaGallery images={s.image_urls || []} videos={[]} alt={s.name} aspect="video" showThumbnails={false} />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base truncate">{s.name}</CardTitle>
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                      </div>
                      {s.subtitle && <CardDescription className="truncate">{s.subtitle}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="font-semibold">{fmt(s.price_cents, s.currency)}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/vendor/services/${s.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="products">
          {visibleProducts.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No products yet.</CardContent></Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-video">
                    <MediaGallery images={p.image_urls || []} videos={[]} alt={p.name} aspect="video" showThumbnails={false} />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base truncate">{p.name}</CardTitle>
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                    </div>
                    <CardDescription className="truncate">{p.description || '—'}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="font-semibold">{fmt(p.price_cents, p.currency)}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/vendor/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleProductStatus(p.id, p.status)}>
                        {p.status === 'active' ? <><EyeOff className="h-4 w-4"/></> : <><Eye className="h-4 w-4"/></>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          {visibleServices.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No services yet.</CardContent></Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleServices.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  <div className="aspect-video">
                    <MediaGallery images={s.image_urls || []} videos={[]} alt={s.name} aspect="video" showThumbnails={false} />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base truncate">{s.name}</CardTitle>
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                    </div>
                    {s.subtitle && <CardDescription className="truncate">{s.subtitle}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="font-semibold">{fmt(s.price_cents, s.currency)}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/vendor/services/${s.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
