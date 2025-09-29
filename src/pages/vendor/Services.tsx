import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import ServiceImage from "@/components/service/ServiceImage";
import { Plus, Wrench, CheckCircle, DollarSign, Edit, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import StandardDashboardLayout from "@/components/layout/StandardDashboardLayout";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

interface Service { 
  id: string; 
  name: string; 
  subtitle?: string | null; 
  description: string | null; 
  price_cents: number; 
  currency: string; 
  image_urls?: string[] | null;
}

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

  const fmt = (cents: number, currency: string) => 
    new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: (currency || 'myr').toUpperCase() 
    }).format((cents || 0) / 100);

  // Prepare stats data
  const stats = services.length > 0 ? [
    {
      title: "Total Services",
      value: services.length,
      description: "All your service offerings",
      icon: <Wrench className="w-5 h-5" />
    },
    {
      title: "Active Services", 
      value: services.length,
      description: "Currently available",
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      title: "Average Price",
      value: services.length > 0 
        ? fmt(Math.round(services.reduce((sum, s) => sum + s.price_cents, 0) / services.length), services[0]?.currency || 'myr')
        : fmt(0, 'myr'),
      description: "Per service booking",
      icon: <DollarSign className="w-5 h-5" />
    }
  ] : undefined;

  // Prepare actions
  const actions = (
    <Button asChild className="hover-scale shadow-elegant">
      <Link to="/vendor/services/new">
        <Plus className="w-4 h-4 mr-2" />
        New Service
      </Link>
    </Button>
  );

  if (loading) {
    return (
      <StandardDashboardLayout
        title="My Services"
        subtitle="Manage and track your service offerings"
        actions={actions}
      >
        <DashboardSkeleton showStats={false} showHeader={false} cardCount={6} />
      </StandardDashboardLayout>
    );
  }

  if (services.length === 0) {
    return (
      <StandardDashboardLayout
        title="My Services"
        subtitle="Manage and track your service offerings"
        actions={actions}
      >
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="py-16 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No services yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your first service to start offering your expertise to the community
              </p>
            </div>
            <Button asChild className="hover-scale">
              <Link to="/vendor/services/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Service
              </Link>
            </Button>
          </CardContent>
        </Card>
      </StandardDashboardLayout>
    );
  }

  return (
    <StandardDashboardLayout
      title="My Services"
      subtitle="Manage and track your service offerings"
      actions={actions}
      stats={stats}
    >
      {/* Services Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s, index) => (
          <Card 
            key={s.id} 
            className="hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] animate-fade-in group overflow-hidden cursor-pointer"
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => window.location.href = `/service/${s.id}`}
          >
            <div className="aspect-video w-full overflow-hidden relative">
              <ServiceImage 
                imageUrls={s.image_urls}
                serviceName={s.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-3 right-3">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Active
                </div>
              </div>
            </div>
            
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                  {s.name}
                </h3>
                {s.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.subtitle}</p>
                )}
              </div>
              
              {s.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-lg md:text-xl font-bold text-primary">
                  {fmt(s.price_cents, s.currency)}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover-scale"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/vendor/services/${s.id}/edit`;
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover-scale"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/service/${s.id}`;
                        }}
                      >
                        View Service
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/vendor/services/${s.id}/edit`;
                        }}
                      >
                        Edit Service
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Delete Service
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </StandardDashboardLayout>
  );
}