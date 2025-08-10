import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import ServiceBasicInfo from "@/components/service/form/ServiceBasicInfo";
import ServicePricing from "@/components/service/form/ServicePricing";
import ServiceLocation from "@/components/service/form/ServiceLocation";
import ServiceAddons from "@/components/service/form/ServiceAddons";
import ServiceCategories from "@/components/service/form/ServiceCategories";
import ServiceMedia from "@/components/service/form/ServiceMedia";
import ServicePreview from "@/components/service/form/ServicePreview";
import Breadcrumbs from "@/components/common/Breadcrumbs";

const PRICING_MODELS = ["fixed", "hourly", "per_unit"] as const;
const LOCATION_TYPES = ["vendor", "customer", "remote"] as const;
const AVAIL_PRESETS = [
  { id: "weekdays_9_6", label: "Weekdays 9am–6pm" },
  { id: "weekends", label: "Weekends" },
  { id: "custom", label: "Custom / on request" },
] as const;
const CANCEL_POLICIES = ["flexible", "moderate", "strict"] as const;

type PricingModel = typeof PRICING_MODELS[number];

type Addon = { name: string; priceDelta: string; timeDelta: string };

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  subtitle: z.string().max(80, "Keep subtitle concise").optional(),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  currency: z.string().default("myr"),
  pricing_model: z.enum(PRICING_MODELS).default("fixed"),
  duration_minutes: z.string().optional(),
  location_type: z.enum(LOCATION_TYPES).default("vendor"),
  service_area: z.string().optional(),
  radius_km: z.string().optional(),
  lead_time_hours: z.string().optional(),
  availability_preset: z.enum(AVAIL_PRESETS.map(a => a.id) as [string, ...string[]]).default("weekdays_9_6"),
  cancellation_policy: z.enum(CANCEL_POLICIES).default("moderate"),
  show_travel_fee: z.boolean().default(false),
  travel_fee_per_km: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function ServiceForm() {
  const { user } = useAuthRoles();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const { serviceId } = useParams<{ serviceId?: string }>();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (serviceId) {
      setSEO(
        "Edit Service — Professional Listing | CoopMarket",
        "Update your service details and media."
      );
    } else {
      setSEO(
        "Create Service — Professional Listing | CoopMarket",
        "Simple, mobile-friendly form for vendors to publish service offerings."
      );
    }
  }, [serviceId]);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      subtitle: "",
      description: "",
      price: "",
      currency: "myr",
      pricing_model: "fixed",
      duration_minutes: "60",
      location_type: "vendor",
      service_area: "",
      radius_km: "",
      lead_time_hours: "24",
      availability_preset: "weekdays_9_6",
      cancellation_policy: "moderate",
      show_travel_fee: false,
      travel_fee_per_km: "",
    },
  });

  const { watch } = form;
  const pricingModel = watch("pricing_model");
  const locationType = watch("location_type");
  const showTravel = watch("show_travel_fee");
  const availabilityLabel = useMemo(
    () => AVAIL_PRESETS.find(a => a.id === watch("availability_preset"))?.label ?? "",
    [watch("availability_preset")]
  );

  // Load active service categories (services or both)
  useEffect(() => {
    const loadCats = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id,name,type,is_active,sort_order")
          .eq("is_active", true)
          .in("type", ["service", "services", "both"])
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });
        if (error) throw error;
        setCategories(((data as any[]) || []).map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e: any) {
        // Do not block the form
      }
    };
    loadCats();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!serviceId || !user) return;
      try {
        const { data: svc, error } = await supabase
          .from("vendor_services")
          .select("name,subtitle,description,price_cents,currency,pricing_model,duration_minutes,location_type,service_area,service_radius_km,min_notice_minutes,availability_preset,travel_fee_per_km_cents,cancellation_policy,image_urls,video_url")
          .eq("id", serviceId)
          .maybeSingle();
        if (error) throw error;
        if (svc) {
          form.reset({
            name: svc.name || "",
            subtitle: svc.subtitle || "",
            description: svc.description || "",
            price: svc.price_cents ? (svc.price_cents / 100).toFixed(2) : "",
            currency: svc.currency || "myr",
            pricing_model: (svc.pricing_model as any) || "fixed",
            duration_minutes: svc.duration_minutes ? String(svc.duration_minutes) : "",
            location_type: (svc.location_type as any) || "vendor",
            service_area: svc.service_area || "",
            radius_km: svc.service_radius_km ? String(svc.service_radius_km) : "",
            lead_time_hours: svc.min_notice_minutes ? String(Math.round((svc.min_notice_minutes || 0) / 60)) : "",
            availability_preset: (svc.availability_preset as any) || "weekdays_9_6",
            cancellation_policy: (svc.cancellation_policy as any) || "moderate",
            show_travel_fee: !!svc.travel_fee_per_km_cents,
            travel_fee_per_km: svc.travel_fee_per_km_cents ? (svc.travel_fee_per_km_cents / 100).toFixed(2) : "",
          });
          setImageUrls(Array.isArray(svc.image_urls) ? svc.image_urls : []);
          setVideoUrl(svc.video_url || "");

          const { data: addonRows, error: addErr } = await supabase
            .from("service_addons")
            .select("name,price_delta_cents,time_delta_minutes")
            .eq("service_id", serviceId);
          if (addErr) throw addErr;
          setAddons((addonRows || []).map((r: any) => ({
            name: r.name,
            priceDelta: r.price_delta_cents ? (r.price_delta_cents / 100).toString() : "",
            timeDelta: r.time_delta_minutes ? String(r.time_delta_minutes) : "",
          })));

          // Load selected categories for edit mode
          try {
            const { data: scRows } = await supabase
              .from("service_categories")
              .select("category_id")
              .eq("service_id", serviceId);
            setSelectedCategoryIds(((scRows as any[]) || []).map((r: any) => r.category_id));
          } catch {}
        }
      } catch (e: any) {
        toast("Failed to load service", { description: e.message || String(e) });
      }
    };
    load();
  }, [serviceId, user]);

  const onSubmit = async (data: ServiceFormData) => {
    if (!user) { navigate("/auth"); return; }
    setSaving(true);
    try {
      let vendorId: string | undefined;
      // Only needed for create
      if (!serviceId) {
        const { data: vend, error: vErr } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (vErr) throw vErr;
        if (!vend) { toast("No vendor profile", { description: "Join as vendor first." }); navigate("/getting-started"); return; }
        vendorId = (vend as any).id as string;
      }

      // Compose description
      const lines: string[] = [];
      const baseDesc = (data.description || "").trim();
      if (baseDesc) lines.push(baseDesc);
      if (data.subtitle) lines.push(`Subtitle: ${data.subtitle.trim()}`);
      lines.push(`Pricing: ${data.pricing_model}`);
      if (data.duration_minutes) lines.push(`Duration: ${parseInt(data.duration_minutes, 10)} min`);
      lines.push(`Location: ${data.location_type}`);
      if (data.service_area) lines.push(`Service area: ${data.service_area.trim()}`);
      if (data.radius_km) lines.push(`Radius km: ${parseFloat(data.radius_km)}`);
      if (data.lead_time_hours) lines.push(`Lead time hours: ${parseInt(data.lead_time_hours, 10)}`);
      lines.push(`Availability: ${availabilityLabel}`);
      lines.push(`Cancellation: ${data.cancellation_policy}`);
      if (showTravel && data.travel_fee_per_km) {
        lines.push(`Travel fee per km: ${parseFloat(data.travel_fee_per_km)}`);
      }
      if (addons.length) {
        const normalized = addons
          .filter(a => a.name.trim())
          .map(a => `${a.name.trim()}|+${a.priceDelta || 0}|+${a.timeDelta || 0}`)
          .join("; ");
        if (normalized) lines.push(`Addons: ${normalized}`);
      }
      const finalDescription = lines.join("\n");

      if (serviceId) {
        // Update existing service
        const { error: upErr } = await supabase
          .from("vendor_services")
          .update({
            name: data.name.trim(),
            subtitle: data.subtitle?.trim() || null,
            description: finalDescription || null,
            price_cents: Math.round(parseFloat(data.price) * 100),
            currency: data.currency || "myr",
            duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes, 10) : null,
            service_area: data.service_area?.trim() || null,
            pricing_model: data.pricing_model,
            location_type: data.location_type,
            service_radius_km: data.radius_km ? Math.max(0, Math.round(parseFloat(data.radius_km))) : null,
            min_notice_minutes: data.lead_time_hours ? Math.max(0, Math.round(parseFloat(data.lead_time_hours) * 60)) : null,
            availability_preset: data.availability_preset,
            travel_fee_per_km_cents: showTravel && data.travel_fee_per_km ? Math.round(parseFloat(data.travel_fee_per_km) * 100) : null,
            cancellation_policy: data.cancellation_policy,
            has_addons: addons.some(a => a.name.trim()),
            image_urls: imageUrls.length ? imageUrls : null,
            video_url: videoUrl ? videoUrl.trim() : null,
          })
          .eq("id", serviceId);
        if (upErr) throw upErr;

        // Replace addons
        await supabase.from("service_addons").delete().eq("service_id", serviceId);
        if (addons.some(a => a.name.trim())) {
          const rows = addons
            .filter(a => a.name.trim())
            .map(a => ({
              service_id: serviceId as string,
              name: a.name.trim(),
              price_delta_cents: a.priceDelta ? Math.round(parseFloat(a.priceDelta) * 100) : 0,
              time_delta_minutes: a.timeDelta ? Math.max(0, Math.round(parseFloat(a.timeDelta))) : 0,
          }));
          
          const { error: addErr } = await supabase.from("service_addons").insert(rows);
          if (addErr) throw addErr;
        }

        // Sync categories
        await supabase.from("service_categories").delete().eq("service_id", serviceId);
        if (selectedCategoryIds.length) {
          const catRows = selectedCategoryIds.map((cid) => ({ service_id: serviceId as string, category_id: cid }));
          const { error: scErr } = await supabase.from("service_categories").insert(catRows);
          if (scErr) throw scErr;
        }
 
        toast.success("Service updated");
        navigate("/vendor/services");
        return;
      }

      // Create new service
      const { data: inserted, error } = await supabase
        .from("vendor_services")
        .insert({
          vendor_id: vendorId!,
          name: data.name.trim(),
          subtitle: data.subtitle?.trim() || null,
          description: finalDescription || null,
          price_cents: Math.round(parseFloat(data.price) * 100),
          currency: data.currency || "myr",
          duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes, 10) : null,
          service_area: data.service_area?.trim() || null,
          status: "active",
          pricing_model: data.pricing_model,
          location_type: data.location_type,
          service_radius_km: data.radius_km ? Math.max(0, Math.round(parseFloat(data.radius_km))) : null,
          min_notice_minutes: data.lead_time_hours ? Math.max(0, Math.round(parseFloat(data.lead_time_hours) * 60)) : null,
          availability_preset: data.availability_preset,
          travel_fee_per_km_cents: showTravel && data.travel_fee_per_km ? Math.round(parseFloat(data.travel_fee_per_km) * 100) : null,
          cancellation_policy: data.cancellation_policy,
          has_addons: addons.some(a => a.name.trim()),
          image_urls: imageUrls.length ? imageUrls : null,
          video_url: videoUrl ? videoUrl.trim() : null,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;

      const newId = (inserted as any)?.id as string | undefined;
      if (newId && addons.some(a => a.name.trim())) {
        const rows = addons
          .filter(a => a.name.trim())
          .map(a => ({
            service_id: newId,
            name: a.name.trim(),
            price_delta_cents: a.priceDelta ? Math.round(parseFloat(a.priceDelta) * 100) : 0,
            time_delta_minutes: a.timeDelta ? Math.max(0, Math.round(parseFloat(a.timeDelta))) : 0,
          }));
        const { error: addErr } = await supabase.from("service_addons").insert(rows);
        if (addErr) throw addErr;
       }

       // Insert categories mapping
       if (newId && selectedCategoryIds.length) {
         const catRows = selectedCategoryIds.map((cid) => ({ service_id: newId, category_id: cid }));
         const { error: scErr } = await supabase.from("service_categories").insert(catRows);
         if (scErr) throw scErr;
       }
 
       toast.success("Service created");
       navigate("/vendor/services");
    } catch (e: any) {
      toast(serviceId ? "Failed to update service" : "Failed to create service", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  const addAddon = () => setAddons((prev) => [...prev, { name: "", priceDelta: "", timeDelta: "" }]);
  const removeAddon = (idx: number) => setAddons((prev) => prev.filter((_, i) => i !== idx));
  const updateAddon = (idx: number, patch: Partial<Addon>) =>
    setAddons((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <main className="container px-4 py-6 pb-24 md:py-8">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Vendor", href: "/vendor/services" },
            { label: "Services", href: "/vendor/services" },
            { label: serviceId ? "Edit Service" : "Create Service" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {serviceId ? "Edit Service" : "Create New Service"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="service-form">
                  <ServiceBasicInfo control={form.control} watch={watch} />
                  <ServicePricing control={form.control} watch={watch} />
                  <ServiceLocation control={form.control} watch={watch} />
                  <ServiceAddons 
                    addons={addons}
                    onAddAddon={addAddon}
                    onRemoveAddon={removeAddon}
                    onUpdateAddon={updateAddon}
                  />
                  <ServiceCategories
                    categories={categories}
                    selectedCategoryIds={selectedCategoryIds}
                    onToggleCategory={toggleCategory}
                  />
                  <ServiceMedia
                    userId={user?.id}
                    imageUrls={imageUrls}
                    videoUrl={videoUrl}
                    onImageUrlsChange={setImageUrls}
                    onVideoUrlChange={setVideoUrl}
                  />
                  
                  {/* Policies */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Policies</h3>
                    <FormField
                      control={form.control}
                      name="cancellation_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cancellation policy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-50 bg-popover">
                              <SelectItem value="flexible">Flexible</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="strict">Strict</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Preview Sidebar */}
          <aside className="lg:col-span-1">
            <ServicePreview
              name={watch("name")}
              subtitle={watch("subtitle")}
              price={watch("price")}
              currency={watch("currency")}
              duration={watch("duration_minutes")}
              locationType={watch("location_type")}
              imageUrls={imageUrls}
              pricingModel={watch("pricing_model")}
            />
          </aside>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm min-w-0">
                <span className="font-medium truncate">
                  {watch("name") || "Untitled service"}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {(() => {
                    const p = parseFloat(watch("price") || "");
                    const cur = (watch("currency") || "myr").toUpperCase();
                    if (isNaN(p)) return "";
                    return new Intl.NumberFormat(cur === "MYR" ? "ms-MY" : "en-US", { 
                      style: "currency", 
                      currency: cur 
                    }).format(p);
                  })()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/vendor/services")}
                  className="hidden sm:flex"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="service-form"
                  disabled={saving}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {saving ? "Saving…" : (serviceId ? "Update" : "Publish")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}