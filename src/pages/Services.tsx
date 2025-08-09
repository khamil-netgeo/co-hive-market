import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import ServiceImage from "@/components/service/ServiceImage";

interface Service {
  id: string;
  vendor_id: string;
  name: string;
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  duration_minutes?: number | null;
  service_area?: string | null;
  location_type?: string | null;
  availability_preset?: string | null;
  image_urls?: string[] | null;
}


export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleById, setScheduleById] = useState<Record<string, string>>({}); // datetime-local values
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
const [visibleCount, setVisibleCount] = useState(9);
// Categories filter state
const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
const [categoryFilter, setCategoryFilter] = useState<string>("all");
const [serviceCats, setServiceCats] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setSEO("Book Local Services | CoopMarket", "Find, compare, and book community services with secure checkout.");
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("vendor_services")
          .select("id,vendor_id,name,subtitle,description,price_cents,currency,status,duration_minutes,service_area,location_type,availability_preset,image_urls")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setServices(((data as any[]) || []).map((s) => ({
          id: s.id,
          vendor_id: s.vendor_id,
          name: s.name,
          subtitle: s.subtitle ?? null,
          description: s.description,
          price_cents: s.price_cents,
          currency: s.currency || "myr",
          duration_minutes: s.duration_minutes ?? null,
          service_area: s.service_area ?? null,
          location_type: s.location_type ?? null,
          availability_preset: s.availability_preset ?? null,
          image_urls: s.image_urls ?? null,
        })));

        // Fetch categories and service-category mapping
        const serviceIds = (((data as any[]) || []).map((s: any) => s.id)).filter(Boolean);
        const [catRes, scRes] = await Promise.all([
          supabase
            .from("categories")
            .select("id,name,type,is_active,sort_order")
            .eq("is_active", true)
            .in("type", ["services", "both"])
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
          serviceIds.length
            ? supabase.from("service_categories").select("service_id,category_id").in("service_id", serviceIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);
        if ((catRes as any).error) throw (catRes as any).error;
        if ((scRes as any).error) throw (scRes as any).error;
        setCategories((((catRes as any).data as any[]) || []).map((c: any) => ({ id: c.id, name: c.name })));
        const map: Record<string, string[]> = {};
        (((scRes as any).data as any[]) || []).forEach((row: any) => {
          (map[row.service_id] ||= []).push(row.category_id);
        });
        setServiceCats(map);
 
       } catch (e: any) {
        toast("Failed to load services", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (cents: number, currency: string) =>
    new Intl.NumberFormat(currency.toUpperCase() === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: currency.toUpperCase() }).format((cents || 0) / 100);

  const normalized = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = [...services];
    if (q) {
      arr = arr.filter((s) =>
        s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      arr = arr.filter((s) => (serviceCats[s.id] || []).includes(categoryFilter));
    }
    if (sort === "price_asc") arr.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
    else if (sort === "price_desc") arr.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
    // "newest" is default from query order
    return arr;
  }, [services, query, sort, categoryFilter, serviceCats]);

  const displayed = useMemo(() => normalized.slice(0, visibleCount), [normalized, visibleCount]);

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: normalized.map((s, i) => ({
      "@type": "Service",
      name: s.name,
      description: s.description || undefined,
      areaServed: s.service_area || undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: (s.currency || "MYR").toUpperCase(),
        price: ((s.price_cents || 0) / 100).toFixed(2),
      },
      position: i + 1,
    })),
  }), [normalized]);

  const book = async (svc: Service) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Sign in required", { description: "Create an account to book services." });
        window.location.href = "/auth";
        return;
      }
      const buyerId = sessionData.session.user.id;
      const when = scheduleById[svc.id] ? new Date(scheduleById[svc.id]).toISOString() : null;
      // Create a booking row first
      const { data: bookingRows, error: bookingErr } = await supabase
        .from("service_bookings")
        .insert({
          service_id: svc.id,
          buyer_user_id: buyerId,
          scheduled_at: when,
          total_amount_cents: svc.price_cents,
          currency: svc.currency,
          notes: (notesById[svc.id]?.trim() || null),
        })
        .select("id")
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      const bookingId = (bookingRows as any)?.id;

      // Fetch vendor's community for proper ledger attribution
      const { data: vendorRow, error: vErr } = await supabase
        .from("vendors")
        .select("community_id")
        .eq("id", svc.vendor_id)
        .maybeSingle();
      if (vErr) throw vErr;
      const communityId = (vendorRow as any)?.community_id as string | undefined;

      // Start Stripe checkout via existing function with metadata
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Service: ${svc.name}`,
          amount_cents: svc.price_cents,
          currency: svc.currency || "myr",
          success_path: `/payment-success?booking_id=${bookingId}`,
          cancel_path: "/payment-canceled",
          vendor_id: svc.vendor_id,
          community_id: communityId,
        },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.open(url, "_blank");
    } catch (e: any) {
      toast("Unable to book", { description: e.message || String(e) });
    }
  };

  return (
    <main className="container py-12 md:py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">Book community services and pay per visit.</p>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mt-6 grid gap-3 md:flex md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services..."
          aria-label="Search services"
          className="w-full md:max-w-md"
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Category</span>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="mt-8 text-muted-foreground">Loading services…</div>
      ) : normalized.length === 0 ? (
        <div className="mt-8 rounded-md border bg-card p-6 text-muted-foreground">No services yet.</div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayed.map((svc) => (
              <Card key={svc.id} className="hover:shadow-elegant transition-shadow">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <ServiceImage 
                    imageUrls={svc.image_urls}
                    serviceName={svc.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{svc.name}</CardTitle>
                  {svc.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{svc.subtitle}</p>
                  )}
                </CardHeader>
                <CardContent className="grid gap-3">
                  {svc.description && (
                    <p className="text-sm text-muted-foreground">{svc.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {typeof svc.duration_minutes === "number" && svc.duration_minutes > 0 && (
                      <span>{svc.duration_minutes} min</span>
                    )}
                    {svc.service_area && <span aria-label="Service area">{svc.service_area}</span>}
                  </div>
                  <div className="text-2xl font-semibold">{fmt(svc.price_cents, svc.currency)}</div>
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground" htmlFor={`dt-${svc.id}`}>
                      Preferred date & time (optional)
                    </label>
                    <Input
                      id={`dt-${svc.id}`}
                      type="datetime-local"
                      value={scheduleById[svc.id] || ""}
                      onChange={(e) =>
                        setScheduleById((m) => ({ ...m, [svc.id]: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground" htmlFor={`note-${svc.id}`}>
                      Notes (optional)
                    </label>
                    <Textarea
                      id={`note-${svc.id}`}
                      value={notesById[svc.id] || ""}
                      onChange={(e) =>
                        setNotesById((m) => ({ ...m, [svc.id]: e.target.value }))
                      }
                      placeholder="Add instructions for the vendor..."
                    />
                  </div>
                  <div>
                    <Button variant="hero" onClick={() => book(svc)} className="w-full sm:w-auto">
                      Book & Pay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {normalized.length > visibleCount && (
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" onClick={() => setVisibleCount((n) => n + 9)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
