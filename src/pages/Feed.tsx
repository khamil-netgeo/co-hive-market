import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { setSEOAdvanced } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

// TikTok-style vertical shopping feed (products + services)
// Mobile-first, full-screen, swipeable interface

type FeedProduct = {
  kind: "product";
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id?: string | null;
  video_url: string;
  created_at: string;
};

type FeedService = {
  kind: "service";
  id: string;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  price_cents: number;
  currency: string;
  vendor_id: string;
  video_url: string;
  created_at: string;
};

type FeedItem = FeedProduct | FeedService;

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const navigate = useNavigate();
  const { add } = useCart();

  useEffect(() => {
    setSEOAdvanced({
      title: "Shop Feed – TikTok-style shopping",
      description: "Swipe through shoppable videos. Add to cart or buy in seconds.",
      type: "website",
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Shop Feed',
        description: 'Vertical video shopping experience',
      },
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: products, error: pErr }, { data: services, error: sErr }] = await Promise.all([
          supabase
            .from("products")
            .select("id,name,description,price_cents,currency,vendor_id,community_id,video_url,created_at,status")
            .not("video_url", "is", null)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("vendor_services")
            .select("id,name,subtitle,description,price_cents,currency,vendor_id,video_url,created_at,status")
            .not("video_url", "is", null)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (pErr) throw pErr;
        if (sErr) throw sErr;
        const normalized: FeedItem[] = [
          ...((products as any[]) || []).map((p) => ({
            kind: "product",
            id: p.id,
            name: p.name,
            description: p.description,
            price_cents: p.price_cents,
            currency: p.currency,
            vendor_id: p.vendor_id,
            community_id: p.community_id,
            video_url: p.video_url,
            created_at: p.created_at,
          } as FeedProduct)),
          ...((services as any[]) || []).map((s) => ({
            kind: "service",
            id: s.id,
            name: s.name,
            subtitle: s.subtitle,
            description: s.description,
            price_cents: s.price_cents,
            currency: s.currency,
            vendor_id: s.vendor_id,
            video_url: s.video_url,
            created_at: s.created_at,
          } as FeedService)),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setItems(normalized);
      } catch (e: any) {
        toast("Failed to load feed", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Auto play current, pause others
    videoRefs.current.forEach((el, idx) => {
      if (!el) return;
      if (idx === active) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [active, items.length]);

  const fmt = (cents: number, cur: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: (cur || "MYR").toUpperCase() }).format(
      Math.max(0, cents) / 100
    );

  const onAddToCart = (it: FeedItem) => {
    if (it.kind === "product") {
      add({
        product_id: it.id,
        name: it.name,
        price_cents: it.price_cents,
        currency: it.currency,
        vendor_id: it.vendor_id,
        community_id: (it as FeedProduct).community_id || "",
      });
      toast.success("Added to cart");
    } else {
      navigate(`/service/${it.id}`);
    }
  };

  const onPrimary = (it: FeedItem) => {
    if (it.kind === "product") navigate(`/product/${it.id}`);
    else navigate(`/service/${it.id}`);
  };

  const registerVideo = (index: number) => (el: HTMLVideoElement | null) => {
    if (!el) return;
    videoRefs.current.set(index, el);
  };

  const overlay = (it: FeedItem) => (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4 sm:p-6 video-overlay">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight text-white drop-shadow-lg">
          {it.name}
        </h1>
        <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md">
          {(it as any).subtitle || it.description || ""}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
            {fmt(it.price_cents, it.currency)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex gap-3 pointer-events-auto">
        <Button size="lg" variant="tiktok" className="font-bold" onClick={() => onPrimary(it)}>
          {it.kind === "product" ? "Buy now" : "Book now"}
        </Button>
        <Button size="lg" variant="hero" className="font-bold" onClick={() => onAddToCart(it)}>
          {it.kind === "product" ? "Add to cart" : "View details"}
        </Button>
      </div>
    </div>
  );

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="h-[100svh] flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading feed…</span>
        </div>
      );
    }
    if (!items.length) {
      return (
        <div className="h-[100svh] flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl font-semibold">No clips yet</h1>
          <p className="text-muted-foreground">Follow vendors and check back soon.</p>
          <div className="mt-2">
            <Button variant="hero" onClick={() => navigate("/catalog")}>Browse Catalog</Button>
          </div>
        </div>
      );
    }
    return (
      <Carousel orientation="vertical" opts={{ loop: false }} className="h-[100svh]">
        <CarouselContent className="h-[100svh]">
          {items.map((it, idx) => (
            <CarouselItem key={`${it.kind}-${it.id}`} className="h-[100svh] relative">
              <div className="absolute inset-0">
                <video
                  ref={registerVideo(idx)}
                  src={it.video_url}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay={idx === 0}
                  loop
                  onPlay={() => setActive(idx)}
                  onClick={() => setActive(idx)}
                />
              </div>
              {overlay(it)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  }, [items, loading]);

  return (
    <main role="main" className="relative">
      {content}
    </main>
  );
}
