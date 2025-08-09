import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const DIETARY_OPTIONS = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "halal",
  "kosher",
  "organic",
] as const;

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  currency: z.string().default("myr"),
  status: z.enum(["active", "inactive", "archived"]).default("inactive"),
  category: z.enum(["grocery", "food", "other"]).default("grocery"),
  perishable: z.boolean().default(false),
  refrigeration_required: z.boolean().default(false),
  weight_grams: z.string().optional(),
  stock_qty: z.string().default("0"),
  prep_time_minutes: z.string().optional(),
  pickup_lat: z.string().optional(),
  pickup_lng: z.string().optional(),
  best_before: z.date().optional(),
  dietary_tags: z.array(z.enum(DIETARY_OPTIONS)).optional().default([]),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

const ProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthRoles();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditing = Boolean(productId);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      currency: "myr",
      status: "inactive",
      category: "grocery",
      perishable: false,
      refrigeration_required: false,
      weight_grams: "",
      stock_qty: "0",
      prep_time_minutes: "",
      pickup_lat: "",
      pickup_lng: "",
    },
  });

  useEffect(() => {
    setSEO(
      `${isEditing ? 'Edit' : 'Create'} Product — Groceries & Food | CoopMarket`,
      `${isEditing ? 'Edit' : 'Create'} simple listings tailored for groceries and prepared food.`
    );
    
    if (user && !loading) {
      fetchData();
    }
  }, [user, loading, productId]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;

      if (!vendorData) {
        toast.error("You don't have a vendor profile. Please join as a vendor first.");
        navigate("/getting-started");
        return;
      }

      setVendor(vendorData);

      // If editing, fetch product data
      if (isEditing && productId) {
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .eq("vendor_id", vendorData.id)
          .maybeSingle();

        if (productError) throw productError;

        if (!productData) {
          toast.error("Product not found");
          navigate("/vendor/dashboard");
          return;
        }

        // Populate form with existing data
        const fullDesc = productData.description || "";
        const descLines = fullDesc.split("\n");
        let parsedDate: Date | undefined = undefined;
        let parsedDiet: (typeof DIETARY_OPTIONS)[number][] = [];
        const baseDesc = descLines
          .filter((l) => {
            if (/^Best before:/i.test(l)) {
              const dateStr = l.split(":").slice(1).join(":").trim();
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) parsedDate = d;
              return false;
            }
            if (/^Dietary:/i.test(l)) {
              const tagsStr = l.split(":").slice(1).join(":").trim();
              parsedDiet = tagsStr
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean)
                .filter((tag): tag is (typeof DIETARY_OPTIONS)[number] => (DIETARY_OPTIONS as readonly string[]).includes(tag));
              return false;
            }
            return true;
          })
          .join("\n")
          .trim();

        form.reset({
          name: productData.name,
          description: baseDesc,
          price: (productData.price_cents / 100).toFixed(2),
          currency: productData.currency,
          status: productData.status as "active" | "inactive" | "archived",
          category: (productData as any).category || "grocery",
          perishable: Boolean((productData as any).perishable),
          refrigeration_required: Boolean((productData as any).refrigeration_required),
          weight_grams: (productData as any).weight_grams?.toString() || "",
          stock_qty: ((productData as any).stock_qty ?? 0).toString(),
          prep_time_minutes: (productData as any).prep_time_minutes?.toString() || "",
          pickup_lat: (productData as any).pickup_lat?.toString() || "",
          pickup_lng: (productData as any).pickup_lng?.toString() || "",
          best_before: parsedDate,
          dietary_tags: parsedDiet,
        });
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const fillPickupFromProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("latitude,longitude")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.latitude && data?.longitude) {
        form.setValue("pickup_lat", String(data.latitude));
        form.setValue("pickup_lng", String(data.longitude));
        toast.success("Pickup location set from your profile");
      } else {
        toast("No saved location", { description: "Set your address & map location in Profile first." });
      }
    } catch (e: any) {
      toast("Unable to read profile", { description: e.message || String(e) });
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!vendor) return;

    setSaving(true);
    try {
      const sanitizeDescription = (desc?: string) =>
        (desc || "")
          .split("\n")
          .filter((l) => !/^Best before:/i.test(l) && !/^Dietary:/i.test(l))
          .join("\n")
          .trim();

      const baseDesc = sanitizeDescription(data.description);
      const parts: string[] = [];
      if (baseDesc) parts.push(baseDesc);
      if (data.best_before) parts.push(`Best before: ${format(data.best_before, "PPP")}`);
      if (data.dietary_tags && data.dietary_tags.length)
        parts.push(`Dietary: ${data.dietary_tags.join(", ")}`);
      const finalDescription = parts.join("\n");

      const productData = {
        name: data.name,
        description: finalDescription || null,
        price_cents: Math.round(parseFloat(data.price) * 100),
        currency: data.currency,
        status: data.status,
        vendor_id: vendor.id,
        community_id: vendor.community_id,
        category: data.category,
        perishable: !!data.perishable,
        refrigeration_required: !!data.refrigeration_required,
        weight_grams: data.weight_grams ? parseInt(data.weight_grams, 10) : null,
        stock_qty: data.stock_qty ? Math.max(0, parseInt(data.stock_qty, 10)) : 0,
        prep_time_minutes: data.prep_time_minutes ? parseInt(data.prep_time_minutes, 10) : null,
        pickup_lat: data.pickup_lat ? parseFloat(data.pickup_lat) : null,
        pickup_lng: data.pickup_lng ? parseFloat(data.pickup_lng) : null,
      };
      if (isEditing && productId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;
        toast.success("Product created successfully");
      }

      navigate("/vendor/dashboard");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !vendor) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/vendor/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update your product details and pricing'
                : 'Add a new product to your marketplace listing'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Product name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Fresh tomatoes, Chicken curry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price + Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Currency is set in More options</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock_qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="e.g. 20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Type */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="grocery">Groceries</SelectItem>
                          <SelectItem value="food">Prepared food</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose Groceries for items like produce, dairy, pantry. Choose Prepared food for cooked meals.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quick presets */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      form.setValue("category", "grocery");
                      form.setValue("perishable", false);
                      form.setValue("refrigeration_required", false);
                      form.setValue("prep_time_minutes", "");
                    }}
                  >
                    Groceries preset
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      form.setValue("category", "food");
                      form.setValue("perishable", true);
                      form.setValue("refrigeration_required", false);
                      if (!form.getValues("prep_time_minutes")) form.setValue("prep_time_minutes", "15");
                    }}
                  >
                    Prepared food preset
                  </Button>
                </div>

                {/* Handling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="perishable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <FormLabel>Perishable</FormLabel>
                          <FormDescription>Requires timely delivery</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refrigeration_required"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <FormLabel>Refrigeration</FormLabel>
                          <FormDescription>Needs cold chain</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Best before (only if perishable) */}
                {form.watch("perishable") && (
                  <FormField
                    control={form.control}
                    name="best_before"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Best before (optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full sm:w-[240px] justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>This will be added to the description</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Dietary tags */}
                <FormField
                  control={form.control}
                  name="dietary_tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dietary tags (optional)</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DIETARY_OPTIONS.map((opt) => {
                          const checked = Array.isArray(field.value) && field.value.includes(opt);
                          return (
                            <label key={opt} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  const current: string[] = Array.isArray(field.value) ? field.value : [];
                                  if (isChecked) {
                                    field.onChange([...current, opt]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== opt));
                                  }
                                }}
                              />
                              <span className="text-sm capitalize">{opt.replace("-", " ")}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FormDescription>These will be added to the description</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ingredients, storage, allergy info..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pickup location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pickup_lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup latitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" placeholder="e.g. 3.139" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickup_lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup longitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" placeholder="e.g. 101.6869" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button type="button" variant="secondary" className="w-full" onClick={fillPickupFromProfile}>
                      Use my profile location
                    </Button>
                  </div>
                </div>

                {/* More options */}
                <div className="space-y-2">
                  <Button type="button" variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
                    {showAdvanced ? 'Hide' : 'More'} options
                  </Button>
                  {showAdvanced && (
                    <div className="space-y-4 rounded-md border p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="usd">USD ($)</SelectItem>
                                  <SelectItem value="eur">EUR (€)</SelectItem>
                                  <SelectItem value="gbp">GBP (£)</SelectItem>
                                  <SelectItem value="myr">MYR (RM)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Inactive products are hidden from customers</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="weight_grams"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (grams)</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} placeholder="e.g. 500" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="prep_time_minutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prep time (min)</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} placeholder="e.g. 15" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/vendor/dashboard">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;