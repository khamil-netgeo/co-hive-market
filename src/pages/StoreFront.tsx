import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductImage from "@/components/product/ProductImage";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Star, Flame, Clock, ShoppingCart, PlayCircle, Store, ArrowRight } from "lucide-react";
import { useVendorFollow } from "@/hooks/useVendorFollow";
import { getProductUrl } from "@/lib/slugs";

interface VendorProfile {
  id: string;
  display_name: string;
  description?: string | null;
  logo_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
}

interface BaseItem {
  id: string;
  vendor_id: string;
  name: string;
  price_cents: number;
  currency: string;
  image_urls?: string[] | null;
  video_url?: string | null;
  created_at?: string;
}

interface ProductItem extends BaseItem {
  type: "product";
  stock_qty?: number | null;
  community_id?: string | null;
  slug?: string;
}

interface ServiceItem extends BaseItem {
  type: "service";
}

type StoreItem = ProductItem | ServiceItem;

interface Voucher {
  id: string;
  title: string | null;
  code: string;
  discount_type: any;
  discount_value: number;
  start_at: string | null;
  end_at: string | null;
  min_order_amount_cents: number;
  free_shipping: boolean;
}

const fmtPrice = (cents: number, currency: string) => {
  const amount = cents / 100;
  const code = currency?.toUpperCase?.() || "USD";
  return new Intl.NumberFormat(code === "MYR" ? "ms-MY" : "en-US", {
    style: "currency",
    currency: code,
  }).format(amount);
};

export default function StoreFront() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { add, vendor_id: cartVendor, currency: cartCurrency, count, subtotal_cents } = useCart();

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"popular" | "new" | "price_asc" | "price_desc">("popular");
  const { isFollowing, followersCount, toggle, loading: followLoading } = useVendorFollow(vendorId);

  useEffect(() => {
    if (!vendorId) return;
    loadData(vendorId);
  }, [vendorId]);

  const loadData = async (vid: string) => {
    try {
      setLoading(true);
      // vendor profile
      const { data: vRow, error: vErr } = await supabase
        .from("vendors")
        .select("id,display_name,description,logo_url,instagram_url,tiktok_url,website_url")
        .eq("id", vid)
        .maybeSingle();
      if (vErr) throw vErr;
      if (!vRow) throw new Error("Vendor not found");
      setVendor(vRow as VendorProfile);

      setSEOAdvanced({
        title: `${vRow.display_name} Store | CoopMarket`,
        description: vRow.description || `${vRow.display_name} — shop products and services from this seller.`,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        image: vRow.logo_url || undefined,
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Store",
          name: vRow.display_name,
          description: vRow.description || undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          image: vRow.logo_url || undefined,
        },
      });

      // products and services
      const [prodRes, svcRes] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,price_cents,currency,image_urls,video_url,stock_qty,community_id,created_at,status,vendor_id")
          .eq("vendor_id", vid)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("vendor_services")
          .select("id,name,price_cents,currency,image_urls,video_url,created_at,status,vendor_id")
          .eq("vendor_id", vid)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (svcRes.error) throw svcRes.error;

      const mapped: StoreItem[] = [
        ...((prodRes.data || []).map(p => ({ ...p, type: "product" as const })) as ProductItem[]),
        ...((svcRes.data || []).map(s => ({ ...s, type: "service" as const })) as ServiceItem[]),
      ];
      setItems(mapped);

      // Active vouchers
      const nowIso = new Date().toISOString();
      const { data: vchs, error: vchErr } = await supabase
        .from("vouchers")
        .select("id,title,code,discount_type,discount_value,end_at,start_at,min_order_amount_cents,free_shipping,status")
        .eq("vendor_id", vid)
        .eq("status", "active")
        .or(`end_at.is.null,end_at.gte.${nowIso}`);
      if (vchErr) throw vchErr;
      const active = (vchs || []).filter((v: any) => !v.start_at || v.start_at <= nowIso);
      setVouchers(active as Voucher[]);

    } catch (e: any) {
      toast.error("Unable to load store", { description: e.message || String(e) });
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const copy = [...items];
    switch (sort) {
      case "new":
        return copy.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      case "price_asc":
        return copy.sort((a, b) => a.price_cents - b.price_cents);
      case "price_desc":
        return copy.sort((a, b) => b.price_cents - a.price_cents);
      case "popular":
      default:
        // Heuristic: low stock first, then newest
        return copy.sort((a, b) => {
          const aLow = (a as ProductItem).stock_qty ?? 9999;
          const bLow = (b as ProductItem).stock_qty ?? 9999;
          if (aLow !== bLow) return aLow - bLow;
          return (b.created_at || "").localeCompare(a.created_at || "");
        });
    }
  }, [items, sort]);

  const quickAdd = (it: StoreItem) => {
    if (it.type !== "product") {
      navigate(`/service/${it.id}`);
      return;
    }
    const vendorMismatch = cartVendor && cartVendor !== it.vendor_id;
    const currencyMismatch = cartCurrency && cartCurrency.toUpperCase() !== (it.currency || "usd").toUpperCase();
    if (vendorMismatch || currencyMismatch) {
      toast("Single vendor cart", { description: "Checkout or clear your cart before mixing vendors/currencies." });
      return;
    }
    add({
      product_id: it.id,
      name: it.name,
      price_cents: it.price_cents,
      currency: it.currency,
      vendor_id: it.vendor_id,
      community_id: (it as ProductItem).community_id || "",
    }, 1);
    toast.success("Added to cart");
  };

  const FlashCard = ({ it }: { it: StoreItem }) => {
    const lowStock = it.type === "product" && typeof (it as ProductItem).stock_qty === "number" && (it as ProductItem).stock_qty! <= 5;
    return (
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <ProductImage 
              imageUrls={it.image_urls || []} 
              productName={it.name} 
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg backdrop-blur-sm">
                <Flame className="h-3 w-3 mr-1" /> Hot
              </Badge>
              {lowStock && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg">
                  Only {(it as ProductItem).stock_qty} left
                </Badge>
              )}
            </div>
            {it.video_url && (
              <div className="absolute top-3 right-3">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-8 w-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 border-0" 
                  onClick={() => navigate(it.type === "product" ? getProductUrl(it) : `/service/${it.id}`)} 
                  aria-label="Watch video"
                >
                  <PlayCircle className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="line-clamp-2 text-sm font-medium text-foreground leading-tight">{it.name}</h3>
              <p className="text-lg font-bold text-primary">{fmtPrice(it.price_cents, it.currency)}</p>
            </div>
            <Button 
              size="sm" 
              variant={it.type === "product" ? "default" : "secondary"}
              onClick={() => quickAdd(it)} 
              className="w-full h-9 font-medium transition-all duration-200 hover:scale-105"
            >
              {it.type === "product" ? (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" /> 
                  Add
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" /> 
                  View
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const timeLeft = (end: string | null) => {
    if (!end) return null;
    const ms = new Date(end).getTime() - Date.now();
    if (ms <= 0) return "Ended";
    const m = Math.floor(ms / 60000);
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const mm = m % 60;
    return d > 0 ? `${d}d ${h}h` : `${h}h ${mm}m`;
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Voucher copied", { description: code });
    } catch {}
  };

  return (
    <main className="px-2 sm:container sm:px-4 py-3 sm:py-6 pb-24">
      {/* Hero */}
      <section className="bg-gradient-to-br from-background to-muted rounded-xl border overflow-hidden">
        <div className="p-4 sm:p-6 flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
            {vendor?.logo_url ? (
              <img src={vendor.logo_url} alt={`${vendor.display_name} logo`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <Store className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold mb-1">{vendor?.display_name}</h1>
            {vendor?.description && <p className="text-sm text-muted-foreground line-clamp-2">{vendor.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs"><Star className="h-3 w-3 mr-1"/> Top Seller</Badge>
              <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1"/> Fast shipping</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant={isFollowing ? "secondary" : "outline"} onClick={toggle} disabled={followLoading}>
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <span className="text-xs text-muted-foreground">{followersCount} followers</span>
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" asChild>
              <a href={vendor?.website_url || "#"} target="_blank" rel="noopener noreferrer">Visit site</a>
            </Button>
            <Button variant="default" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}>Shop now</Button>
          </div>
        </div>
      </section>

      {/* Flash Picks - Enhanced */}
      {!!sorted.length && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Flash Picks
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value as any)} 
                className="h-10 rounded-lg border bg-background px-4 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <option value="popular">🔥 Popular</option>
                <option value="new">✨ Newest</option>
                <option value="price_asc">💰 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
              </select>
            </div>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {sorted.slice(0, 12).map((it) => (
                <CarouselItem key={`${it.type}-${it.id}`} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <FlashCard it={it} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-6" />
            <CarouselNext className="hidden sm:flex -right-4 lg:-right-6" />
          </Carousel>
        </section>
      )}

      {/* Shop Vouchers */}
      {vouchers.length > 0 && (
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Shop vouchers</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {vouchers.map((v) => (
              <Card key={v.id} className="min-w-[220px]">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{v.title || (v.discount_type === 'percent' ? `${v.discount_value}% OFF` : `Save ${fmtPrice(v.discount_value * 100, 'MYR')}`)}</span>
                    {v.end_at && (
                      <Badge variant="secondary" className="text-2xs">Ends in {timeLeft(v.end_at)}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Code: {v.code}</span>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => copyCode(v.code)}>Copy</Button>
                  </div>
                  {v.free_shipping && (
                    <div className="text-2xs text-primary">Free shipping</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card overflow-hidden">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : (
            sorted.map((it) => (
              <div key={`${it.type}-${it.id}`} className="rounded-lg border bg-card overflow-hidden hover-scale">
                <Link to={it.type === "product" ? getProductUrl(it) : `/service/${it.id}`} aria-label={it.name}>
                  <ProductImage imageUrls={it.image_urls || []} productName={it.name} className="w-full aspect-square object-cover" />
                </Link>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-2xs">{it.type === "product" ? "Product" : "Service"}</Badge>
                    {it.type === "product" && (it as ProductItem).stock_qty != null && (it as ProductItem).stock_qty! <= 5 && (
                      <span className="text-2xs text-destructive">Only {(it as ProductItem).stock_qty} left</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium line-clamp-2">{it.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{fmtPrice(it.price_cents, it.currency)}</span>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => quickAdd(it)}>
                      {it.type === "product" ? "Add" : "View"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Sticky Cart Bar */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="px-3 py-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-medium">{count} item{count === 1 ? "" : "s"} in cart</div>
            <div className="text-muted-foreground">Subtotal {fmtPrice(subtotal_cents, cartCurrency || "MYR")}</div>
          </div>
          <Button onClick={() => navigate("/checkout")} className="flex-1">Checkout</Button>
        </div>
      </aside>
    </main>
  );
}
