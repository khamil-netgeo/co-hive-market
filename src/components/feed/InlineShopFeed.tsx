import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Lightweight inline shop feed for the products page
// Randomized TikTok-style vertical shorts inside a fixed-height area

type FeedProduct = {
  kind: "product";
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id?: string | null;
  video_url: string;
};

type FeedService = {
  kind: "service";
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  vendor_id: string;
  video_url: string;
};

type FeedItem = FeedProduct | FeedService;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function InlineShopFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, servicesRes] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,price_cents,currency,vendor_id,community_id,video_url,status")
            .eq("status", "active")
            .not("video_url", "is", null)
            .limit(30),
          supabase
            .from("vendor_services")
            .select("id,name,price_cents,currency,vendor_id,video_url,status")
            .eq("status", "active")
            .not("video_url", "is", null)
            .limit(30),
        ]);
        const prods: FeedProduct[] = ((productsRes.data as any[]) || []).map((p) => ({
          kind: "product",
          id: p.id,
          name: p.name,
          price_cents: p.price_cents,
          currency: p.currency,
          vendor_id: p.vendor_id,
          community_id: p.community_id,
          video_url: p.video_url,
        }));
        const svcs: FeedService[] = ((servicesRes.data as any[]) || []).map((s) => ({
          kind: "service",
          id: s.id,
          name: s.name,
          price_cents: s.price_cents,
          currency: s.currency,
          vendor_id: s.vendor_id,
          video_url: s.video_url,
        }));
        const mixed = shuffle<FeedItem>([...prods, ...svcs]).slice(0, 8);
        setItems(mixed);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    const code = currency?.toUpperCase?.() || "USD";
    return new Intl.NumberFormat(code === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: code }).format(amount);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-full min-w-0">
        <CardContent className="p-3 sm:p-4">
          <div className="text-sm text-muted-foreground">Loading feed…</div>
        </CardContent>
      </Card>
    );
  }

  if (!items.length) return null;

  return (
    <section aria-label="Shop Feed" className="w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Shop Feed</h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/feed">Open full feed</Link>
        </Button>
      </div>
      <Card className="w-full max-w-full min-w-0">
        <CardContent className="p-0">
          <div className="relative h-[70vh] sm:h-[60vh] w-full max-w-full min-w-0 overflow-hidden rounded-lg">
            <div className="h-full w-full overflow-y-auto no-scrollbar snap-y snap-mandatory">
              {items.map((it, idx) => (
                <article key={`${it.kind}-${it.id}`} className="relative h-[70vh] sm:h-[60vh] w-full snap-start">
                  <video
                    src={it.video_url}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    playsInline
                    controls
                    poster="/placeholder.svg"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-background/80 to-background/0 text-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold line-clamp-1 break-words">
                          {it.name}
                        </h3>
                        <p className="text-sm text-primary font-medium mt-0.5">
                          {fmtPrice(it.price_cents, it.currency)}
                        </p>
                      </div>
                      {it.kind === "product" ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link to={`/product/${it.id}`}>View</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="secondary">
                          <Link to={`/service/${it.id}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
