import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import MediaUploader from "@/components/media/MediaUploader";

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

  useEffect(() => {
    setSEO(
      "Create Service — Professional Listing | CoopMarket",
      "Simple, mobile-friendly form for vendors to publish service offerings."
    );
  }, []);

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

  const onSubmit = async (data: ServiceFormData) => {
    if (!user) { navigate("/auth"); return; }
    setSaving(true);
    try {
      const { data: vend, error: vErr } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (vErr) throw vErr;
      if (!vend) { toast("No vendor profile", { description: "Join as vendor first." }); navigate("/getting-started"); return; }

      // Compose professional, parseable description (keeps DB unchanged)
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

      const { data: inserted, error } = await supabase
        .from("vendor_services")
        .insert({
          vendor_id: (vend as any).id,
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

      const serviceId = (inserted as any)?.id as string | undefined;
      if (serviceId && addons.some(a => a.name.trim())) {
        const rows = addons
          .filter(a => a.name.trim())
          .map(a => ({
            service_id: serviceId,
            name: a.name.trim(),
            price_delta_cents: a.priceDelta ? Math.round(parseFloat(a.priceDelta) * 100) : 0,
            time_delta_minutes: a.timeDelta ? Math.max(0, Math.round(parseFloat(a.timeDelta))) : 0,
          }));
        const { error: addErr } = await supabase.from("service_addons").insert(rows);
        if (addErr) throw addErr;
      }

      toast.success("Service created");
      navigate("/vendor/services");
    } catch (e: any) {
      toast("Failed to create service", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  const addAddon = () => setAddons((prev) => [...prev, { name: "", priceDelta: "", timeDelta: "" }]);
  const removeAddon = (idx: number) => setAddons((prev) => prev.filter((_, i) => i !== idx));
  const updateAddon = (idx: number, patch: Partial<Addon>) =>
    setAddons((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  return (
    <main className="container px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Create Service</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Essentials */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Home Cleaning, Private Tutor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short subtitle (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="One line value proposition" {...field} />
                      </FormControl>
                      <FormDescription>Shown in listings and helps SEO.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pricing_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="per_unit">Per unit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g. 60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* When & Where */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vendor">At vendor</SelectItem>
                            <SelectItem value="customer">At customer</SelectItem>
                            <SelectItem value="remote">Remote / online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability_preset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability preset</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAIL_PRESETS.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {locationType !== "remote" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="service_area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service area (districts/areas)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. KLCC, Bangsar, PJ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="radius_km"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Radius (km, optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g. 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lead_time_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum notice (hours)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="e.g. 24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_travel_fee"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <FormLabel>Charge travel fee</FormLabel>
                          <FormDescription>Enable per‑km travel fee</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {showTravel && (
                  <FormField
                    control={form.control}
                    name="travel_fee_per_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel fee per km (currency)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g. 1.50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Policies & Details */}
              <div className="space-y-4">
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
                        <SelectContent>
                          <SelectItem value="flexible">Flexible</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="strict">Strict</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>We'll include this in your listing details.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details & inclusions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's included, exclusions, requirements, certifications, safety notes..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Add-ons (simple) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Add‑ons (optional)</div>
                  <Button type="button" variant="secondary" onClick={addAddon}>Add add‑on</Button>
                </div>
                {addons.length > 0 && (
                  <div className="space-y-2">
                    {addons.map((a, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <Input placeholder="Name (e.g. Deep clean)" value={a.name} onChange={e => updateAddon(i, { name: e.target.value })} />
                        <Input placeholder="+Price (e.g. 20.00)" type="number" step="0.01" value={a.priceDelta} onChange={e => updateAddon(i, { priceDelta: e.target.value })} />
                        <Input placeholder="+Time min (e.g. 15)" type="number" value={a.timeDelta} onChange={e => updateAddon(i, { timeDelta: e.target.value })} />
                        <Button type="button" variant="outline" onClick={() => removeAddon(i)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency (advanced minimal) */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="myr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">Media</div>
                  <MediaUploader bucket="service-images" folder={`${user?.id || 'anonymous'}/services`} value={imageUrls} onChange={setImageUrls} />
                </div>
                <div className="space-y-2">
                  <FormLabel>Promo video URL (optional)</FormLabel>
                  <Input placeholder="https://... (YouTube, Vimeo or MP4)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 sticky bottom-0 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Publish service"}</Button>
                <Button type="button" variant="outline" onClick={() => navigate("/vendor/services")}>Cancel</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
