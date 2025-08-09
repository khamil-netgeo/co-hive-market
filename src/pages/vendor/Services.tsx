import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import ServiceImage from "@/components/service/ServiceImage";
import { Plus, Wrench, CheckCircle, DollarSign, Edit, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    <main className="container py-8 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            My Services
          </h1>
          <p className="text-muted-foreground">
            Manage and track your service offerings
          </p>
        </div>
        <Button asChild className="hover-scale shadow-elegant">
          <Link to="/vendor/services/new">
            <Plus className="w-4 h-4 mr-2" />
            New Service
          </Link>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
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
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                    <p className="text-2xl font-bold text-primary">{services.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                    <p className="text-2xl font-bold text-green-600">{services.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {services.length > 0 
                        ? fmt(Math.round(services.reduce((sum, s) => sum + s.price_cents, 0) / services.length), services[0]?.currency || 'myr')
                        : fmt(0, 'myr')
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s, index) => (
              <Card 
                key={s.id} 
                className="hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] animate-fade-in group overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
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
                
                <CardContent className="p-6 space-y-4">
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
                    <div className="text-xl font-bold text-primary">
                      {fmt(s.price_cents, s.currency)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="hover-scale">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="hover-scale">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
