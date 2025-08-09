import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id: string;
}

interface Vendor { id: string; member_discount_override_percent: number | null }
interface Community { id: string; name: string; member_discount_percent: number }

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorsById, setVendorsById] = useState<Record<string, Vendor>>({});
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [memberCommunities, setMemberCommunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO(
      "Catalog | CoopMarket",
      "Browse products with member discounts. Join a community to save more on CoopMarket."
    );

    const load = async () => {
      try {
        const { data: productsData, error: pErr } = await supabase
          .from("products")
          .select("id,name,description,price_cents,currency,vendor_id,community_id,status")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (pErr) throw pErr;
        const prods = ((productsData as any[]) || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price_cents: p.price_cents,
          currency: p.currency,
          vendor_id: p.vendor_id,
          community_id: p.community_id,
        }));
        setProducts(prods);

        const vendorIds = Array.from(new Set(prods.map((p) => p.vendor_id))).filter(Boolean);
        const communityIds = Array.from(new Set(prods.map((p) => p.community_id))).filter(Boolean);

        const { data: sessionData } = await supabase.auth.getSession();

        const [vendRes, commRes, memberRes] = await Promise.all([
          vendorIds.length
            ? supabase
                .from("vendors")
                .select("id,member_discount_override_percent")
                .in("id", vendorIds)
            : Promise.resolve({ data: [], error: null } as any),
          communityIds.length
            ? supabase
                .from("communities")
                .select("id,name,member_discount_percent")
                .in("id", communityIds)
            : Promise.resolve({ data: [], error: null } as any),
          sessionData.session
            ? supabase
                .from("community_members")
                .select("community_id")
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        if (vendRes.error) throw vendRes.error;
        if (commRes.error) throw commRes.error;
        if (memberRes.error) throw memberRes.error;

        const vMap: Record<string, Vendor> = {};
        (vendRes.data as any[]).forEach((v) => (vMap[v.id] = v));
        setVendorsById(vMap);

        const cMap: Record<string, Community> = {};
        (commRes.data as any[]).forEach((c) => (cMap[c.id] = c));
        setCommunitiesById(cMap);

        const mSet = new Set<string>();
        (memberRes.data as any[]).forEach((m) => mSet.add(m.community_id));
        setMemberCommunities(mSet);
      } catch (e: any) {
        toast("Failed to load catalog", { description: e.message || String(e) });
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

  const effectiveDiscountPercent = (p: Product) => {
    const vendor = vendorsById[p.vendor_id];
    if (vendor && vendor.member_discount_override_percent != null) return vendor.member_discount_override_percent;
    const community = communitiesById[p.community_id];
    return community?.member_discount_percent ?? 0;
  };

  const memberPrice = (p: Product) => {
    const isMember = memberCommunities.has(p.community_id);
    if (!isMember) return null;
    const disc = effectiveDiscountPercent(p);
    const discounted = Math.round(p.price_cents * (1 - (disc || 0) / 100));
    return discounted;
  };

  const buyNow = async (p: Product) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: p.name,
          amount_cents: p.price_cents,
          currency: p.currency || "myr",
          success_path: "/payment-success",
          cancel_path: "/payment-canceled",
          product_id: p.id,
          vendor_id: p.vendor_id,
          community_id: p.community_id,
        },
      });
      if (error) throw error;
      window.open((data as any)?.url, "_blank");
    } catch (e: any) {
      toast("Checkout error", { description: e.message || String(e) });
    }
  };

  const handleJoinCTA = async (communityId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to join communities and unlock discounts." });
        window.location.href = "/auth";
        return;
      }
      const userId = sessionData.session.user.id;
      const { error } = await supabase
        .from("community_members")
        .upsert(
          { community_id: communityId, user_id: userId, member_type: "buyer" },
          { onConflict: "community_id,user_id,member_type" }
        );
      if (error) throw error;
      setMemberCommunities((prev) => new Set(prev).add(communityId));
      toast("Joined community", { description: "Member discount is now applied." });
    } catch (e: any) {
      toast("Unable to proceed", { description: e.message || String(e) });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
            <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
          </a>
          <div className="flex items-center gap-3">
            <Button variant="secondary" asChild>
              <a href="/plans">Plans</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-12 md:py-16">
        <h1 className="text-3xl font-semibold">Catalog</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Member discounts apply automatically when you’re a member of the product’s community.
        </p>

        {loading ? (
          <div className="mt-8 text-muted-foreground">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-md border bg-card p-6 text-muted-foreground">No products yet.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const discounted = memberPrice(p);
              const discPercent = effectiveDiscountPercent(p);
              return (
                <Card key={p.id} className="hover:shadow-elegant transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>{p.name}</span>
                      {discounted != null && discPercent > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Members save {discPercent}%
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {p.description && (
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    )}
                    <div className="text-2xl font-semibold">
                      {discounted != null ? (
                        <div className="flex items-baseline gap-2">
                          <span>{fmtPrice(discounted, p.currency)}</span>
                          <span className="text-base text-muted-foreground line-through">
                            {fmtPrice(p.price_cents, p.currency)}
                          </span>
                        </div>
                      ) : (
                        <span>{fmtPrice(p.price_cents, p.currency)}</span>
                      )}
                    </div>

                    {discounted == null && discPercent > 0 && (
                      <div className="rounded-md border bg-card p-3">
                        <div className="text-sm">
                          Join {communitiesById[p.community_id]?.name || "this community"} to save {discPercent}% and pay {fmtPrice(Math.round(p.price_cents * (1 - discPercent / 100)), p.currency)}.
                        </div>
                        <div className="mt-2">
                          <Button size="sm" variant="secondary" onClick={() => handleJoinCTA(p.community_id)}>
                            Join community to save
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <Button variant="hero" onClick={() => buyNow(p)}>Buy now</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
