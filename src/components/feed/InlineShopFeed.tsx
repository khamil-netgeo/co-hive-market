import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LikeButton from "@/components/feed/LikeButton";
import ShareButtons from "@/components/common/ShareButtons";

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
  const [prodPage, setProdPage] = useState(0);
  const [svcPage, setSvcPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const setVideoRef = useCallback(
    (key: string) => (el: HTMLVideoElement | null) => {
      videoRefs.current[key] = el;
    },
    []
  );

  const PER_KIND_PAGE = 6;

  const loadMore = useCallback(
    async (initial = false) => {
      if (!hasMore && !initial) return;
      if (initial) setLoading(true);
      else setLoadingMore(true);
      try {
        const prodFrom = prodPage * PER_KIND_PAGE;
        const prodTo = prodFrom + PER_KIND_PAGE - 1;
        const svcFrom = svcPage * PER_KIND_PAGE;
        const svcTo = svcFrom + PER_KIND_PAGE - 1;

        const [productsRes, servicesRes] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,price_cents,currency,vendor_id,community_id,video_url,status")
            .eq("status", "active")
            .not("video_url", "is", null)
            .range(prodFrom, prodTo),
          supabase
            .from("vendor_services")
            .select("id,name,price_cents,currency,vendor_id,video_url,status")
            .eq("status", "active")
            .not("video_url", "is", null)
            .range(svcFrom, svcTo),
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

        const mixed = shuffle<FeedItem>([...prods, ...svcs]);

        setItems((prev) => {
          if (initial) return mixed.slice(0, 8);
          return [...prev, ...mixed];
        });

        if (prods.length > 0) setProdPage((p) => p + 1);
        if (svcs.length > 0) setSvcPage((p) => p + 1);

        const gotFullPage = prods.length === PER_KIND_PAGE || svcs.length === PER_KIND_PAGE;
        if (!gotFullPage) setHasMore(false);
      } finally {
        if (initial) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [prodPage, svcPage, hasMore]
  );

  useEffect(() => {
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoplay/pause when a video panel is in view inside the scroll container
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            el.muted = true;
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        });
      },
      { root, threshold: [0, 0.7, 1] }
    );

    const vids = Object.values(videoRefs.current).filter(Boolean) as HTMLVideoElement[];
    vids.forEach((v) => observer.observe(v));

    return () => {
      vids.forEach((v) => observer.unobserve(v));
      observer.disconnect();
    };
  }, [items]);

  // Attach scroll listener for lazy loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
      if (nearBottom && !loadingMore && hasMore) {
        loadMore(false);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadingMore, hasMore, loadMore]);

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
            <div
              ref={containerRef}
              className="h-full w-full overflow-y-auto no-scrollbar snap-y snap-mandatory"
              aria-label="Vertical short videos feed"
            >
              {items.map((it) => (
                <article key={`${it.kind}-${it.id}`} className="relative h-[70vh] sm:h-[60vh] w-full snap-start">
                  <video
                    ref={setVideoRef(`${it.kind}-${it.id}`)}
                    src={it.video_url}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    playsInline
                    muted
                    loop
                    poster="/placeholder.svg"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-background/80 to-background/0 text-foreground">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold line-clamp-1 break-words">{it.name}</h3>
                        <p className="text-sm text-primary font-medium mt-0.5">{fmtPrice(it.price_cents, it.currency)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {it.kind === "product" ? (
                          <Button asChild size="sm" variant="secondary" aria-label="View product">
                            <Link to={`/product/${it.id}`}>View</Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="secondary" aria-label="View service">
                            <Link to={`/service/${it.id}`}>View</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <LikeButton targetType={it.kind === "product" ? "product" : "service"} targetId={it.id} />
                      <ShareButtons title={it.name} url={(typeof window !== 'undefined' ? window.location.origin : '') + `/${it.kind === 'product' ? 'product' : 'service'}/${it.id}` } />
                    </div>
                  </div>
                </article>
              ))}
              {loadingMore && (
                <div className="py-3 text-center text-xs text-muted-foreground">Loading more…</div>
              )}
              {!hasMore && (
                <div className="py-3 text-center text-xs text-muted-foreground">You’ve reached the end</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
