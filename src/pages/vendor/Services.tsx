import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import ServiceImage from "@/components/service/ServiceImage";

interface Service { id: string; name: string; subtitle?: string | null; description: string | null; price_cents: number; currency: string; image_urls?: string[] | null }

export default function VendorServices() {
  const { user } = useAuthRoles();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO("My Services — Vendor", "Manage your service offerings.");
    const load = async () => {
      try {
        if (!user) return;
        const { data: vend, error: vErr } = await supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle();
        if (vErr) throw vErr;
        if (!vend) return;
        const { data, error } = await supabase
          .from("vendor_services")
          .select("id,name,subtitle,description,price_cents,currency,image_urls")
          .eq("vendor_id", (vend as any).id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setServices((data as any) || []);
      } catch (e: any) {
        toast("Failed to load services", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const fmt = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || 'myr').toUpperCase() }).format((cents||0)/100);

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Services</h1>
        <Button asChild><Link to="/vendor/services/new">New Service</Link></Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No services yet. Create your first one.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((s) => (
            <Card key={s.id}>
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <ServiceImage 
                    imageUrls={s.image_urls}
                    serviceName={s.name}
                    className="w-full h-full object-cover rounded-l-lg"
                    fallbackClassName="w-full h-full bg-muted rounded-l-lg flex items-center justify-center"
                  />
                </div>
                <div className="flex-1">
                  <CardHeader>
                    <CardTitle>{s.name}</CardTitle>
                    {s.subtitle && <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>}
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground max-w-prose">{s.description}</div>
                    <div className="font-medium">{fmt(s.price_cents, s.currency)}</div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
