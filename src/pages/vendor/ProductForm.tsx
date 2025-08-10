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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import MediaUploader from "@/components/media/MediaUploader";
import ProductImage from "@/components/product/ProductImage";

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
  category: z.string().min(1, "Category is required"),
  product_kind: z.enum(["prepared_food","packaged_food","grocery","other"]).default("other"),
  perishable: z.boolean().default(false),
  refrigeration_required: z.boolean().default(false),
  weight_grams: z.string().optional(),
  length_cm: z.string().optional(),
  width_cm: z.string().optional(),
  height_cm: z.string().optional(),
  allow_easyparcel: z.boolean().default(true),
  allow_rider_delivery: z.boolean().default(true),
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

interface Category {
  id: string;
  name: string;
  slug: string;
  type: "product" | "service" | "both";
  parent_id: string | null;
  sort_order: number;
}

const ProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuthRoles();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const isEditing = Boolean(productId);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      currency: "myr",
      status: "inactive",
      category: "",
      product_kind: "grocery",
      perishable: false,
      refrigeration_required: false,
      weight_grams: "",
      length_cm: "",
      width_cm: "",
      height_cm: "",
      allow_easyparcel: true,
      allow_rider_delivery: true,
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

      // Load available categories (product/both)
      const { data: cats, error: catsErr } = await supabase
        .from("categories")
        .select("id,name,slug,type,parent_id,sort_order,is_active")
        .eq("is_active", true)
        .in("type", ["product", "both"])
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (catsErr) throw catsErr;
      const catList = (cats as any) || [];
      setAvailableCategories(catList);
      
      // Set default category if creating
      if (!isEditing && catList.length && !form.getValues("category")) {
        form.setValue("category", catList[0].slug);
      }

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

        // Media
        setImageUrls((productData as any).image_urls || []);
        setVideoUrl((productData as any).video_url || "");

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
          product_kind: (productData as any).product_kind || ((productData as any).category === 'food' ? 'prepared_food' : ((productData as any).category === 'grocery' ? 'grocery' : 'other')),
          perishable: Boolean((productData as any).perishable),
          refrigeration_required: Boolean((productData as any).refrigeration_required),
          weight_grams: (productData as any).weight_grams?.toString() || "",
          length_cm: (productData as any).length_cm?.toString() || "",
          width_cm: (productData as any).width_cm?.toString() || "",
          height_cm: (productData as any).height_cm?.toString() || "",
          allow_easyparcel: (productData as any).allow_easyparcel ?? true,
          allow_rider_delivery: (productData as any).allow_rider_delivery ?? true,
          stock_qty: ((productData as any).stock_qty ?? 0).toString(),
          prep_time_minutes: (productData as any).prep_time_minutes?.toString() || "",
          pickup_lat: (productData as any).pickup_lat?.toString() || "",
          pickup_lng: (productData as any).pickup_lng?.toString() || "",
          best_before: parsedDate,
          dietary_tags: parsedDiet,
        });

        // Load selected categories for this product
        const { data: pc, error: pcErr } = await supabase
          .from("product_categories")
          .select("category_id")
          .eq("product_id", productId);
        if (pcErr) throw pcErr;
        setSelectedCategoryIds(((pc as any) || []).map((r: any) => r.category_id));
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
        category: data.category, // store slug for legacy compatibility
        product_kind: data.product_kind,
        perishable: !!data.perishable,
        refrigeration_required: !!data.refrigeration_required,
        weight_grams: data.weight_grams ? parseInt(data.weight_grams, 10) : null,
        length_cm: data.length_cm ? parseInt(data.length_cm, 10) : null,
        width_cm: data.width_cm ? parseInt(data.width_cm, 10) : null,
        height_cm: data.height_cm ? parseInt(data.height_cm, 10) : null,
        allow_easyparcel: !!data.allow_easyparcel,
        allow_rider_delivery: !!data.allow_rider_delivery,
        stock_qty: data.stock_qty ? Math.max(0, parseInt(data.stock_qty, 10)) : 0,
        prep_time_minutes: data.prep_time_minutes ? parseInt(data.prep_time_minutes, 10) : null,
        pickup_lat: data.pickup_lat ? parseFloat(data.pickup_lat) : null,
        pickup_lng: data.pickup_lng ? parseFloat(data.pickup_lng) : null,
        image_urls: imageUrls.length ? imageUrls : null,
        video_url: videoUrl ? videoUrl.trim() : null,
      };

      let productIdToUse: string | null = null;

      if (isEditing && productId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);
        if (error) throw error;
        productIdToUse = productId;
        toast.success("Product updated successfully");
      } else {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();
        if (error) throw error;
        productIdToUse = (inserted as any)?.id || null;
        toast.success("Product created successfully");
      }

      // Sync product categories
      if (productIdToUse) {
        const { error: delErr } = await supabase
          .from("product_categories")
          .delete()
          .eq("product_id", productIdToUse);
        if (delErr) throw delErr;

        if (selectedCategoryIds.length > 0) {
          const rows = selectedCategoryIds.map((cid) => ({ product_id: productIdToUse!, category_id: cid }));
          const { error: insErr } = await supabase
            .from("product_categories")
            .insert(rows as any);
          if (insErr) throw insErr;
        }
      }

      navigate("/vendor/dashboard");
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product", { description: error?.message || error?.hint || error?.code || "Permission denied" });
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-fade-in">
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
                          <FormLabel>Price (MYR)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_qty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="e.g. 20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category selection */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-select this category in the multi-select too
                          const selectedCat = availableCategories.find(c => c.slug === value);
                          if (selectedCat && !selectedCategoryIds.includes(selectedCat.id)) {
                            setSelectedCategoryIds(prev => [...prev, selectedCat.id]);
                          }
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose the main category for your product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map((c) => (
                              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the category that best describes your product
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quick setup buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("product_kind", "grocery");
                        form.setValue("perishable", false);
                        form.setValue("refrigeration_required", false);
                        form.setValue("prep_time_minutes", "");
                        form.setValue("allow_easyparcel", true);
                        form.setValue("allow_rider_delivery", true);
                        const c = availableCategories.find((x) => x.slug.includes("grocery"));
                        if (c) form.setValue("category", c.slug);
                        toast.success("Settings applied for grocery products");
                      }}
                    >
                      🥬 Grocery Setup
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("product_kind", "prepared_food");
                        form.setValue("perishable", true);
                        form.setValue("refrigeration_required", false);
                        if (!form.getValues("prep_time_minutes")) form.setValue("prep_time_minutes", "15");
                        form.setValue("allow_easyparcel", false);
                        form.setValue("allow_rider_delivery", true);
                        const c = availableCategories.find((x) => x.slug.includes("food"));
                        if (c) form.setValue("category", c.slug);
                        toast.success("Settings applied for prepared food");
                      }}
                    >
                      🍜 Prepared Food Setup
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("product_kind", "packaged_food");
                        form.setValue("perishable", false);
                        form.setValue("refrigeration_required", false);
                        form.setValue("allow_easyparcel", true);
                        form.setValue("allow_rider_delivery", true);
                        toast.success("Settings applied for packaged products");
                      }}
                    >
                      📦 Packaged Setup
                    </Button>
                  </div>

                  {/* Product Type */}
                  <FormField
                    control={form.control}
                    name="product_kind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <Select onValueChange={(v) => {
                          field.onChange(v);
                          // Auto-apply sensible defaults
                          if (v === 'prepared_food') {
                            form.setValue('allow_easyparcel', false);
                            form.setValue('allow_rider_delivery', true);
                            form.setValue('perishable', true);
                            if (!form.getValues('prep_time_minutes')) form.setValue('prep_time_minutes', '15');
                          } else if (v === 'packaged_food') {
                            form.setValue('allow_easyparcel', true);
                            form.setValue('allow_rider_delivery', true);
                            form.setValue('perishable', false);
                            form.setValue('refrigeration_required', false);
                          }
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="What type of product is this?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prepared_food">🍜 Prepared Food (hot meals, cooked dishes)</SelectItem>
                            <SelectItem value="packaged_food">📦 Packaged Food (shelf-stable, canned)</SelectItem>
                            <SelectItem value="grocery">🥬 Fresh Groceries (fruits, vegetables)</SelectItem>
                            <SelectItem value="other">📱 Other Products</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This determines shipping options: prepared food = rider only, fresh groceries = rider only if perishable
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Shipping & fulfillment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="allow_easyparcel"
                      render={({ field }) => {
                        const pk = form.watch('product_kind');
                        const perishable = form.watch('perishable');
                        const disableEP = pk === 'prepared_food' || (pk === 'grocery' && perishable === true);
                        return (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <div>
                              <FormLabel>EasyParcel shipping</FormLabel>
                              <FormDescription>
                                {disableEP ? 'Disabled for prepared food or perishable groceries' : 'Enable courier shipping for this product'}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value && !disableEP} onCheckedChange={(v) => field.onChange(v)} disabled={disableEP} />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="allow_rider_delivery"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <FormLabel>Rider delivery</FormLabel>
                            <FormDescription>Local delivery by riders</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Parcel dimensions (for EasyParcel) */}
                  {form.watch('allow_easyparcel') && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="length_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} placeholder="e.g. 20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="width_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} placeholder="e.g. 15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} placeholder="e.g. 10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

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
                            <Switch checked={field.value} onCheckedChange={(v) => {
                              field.onChange(v);
                              const pk = form.getValues('product_kind');
                              if (pk === 'grocery') {
                                if (v) {
                                  form.setValue('allow_easyparcel', false);
                                  form.setValue('allow_rider_delivery', true);
                                } else {
                                  form.setValue('allow_easyparcel', true);
                                }
                              }
                            }} />
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

                  {/* Media */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="font-medium">Product Images</div>
                      <MediaUploader bucket="product-images" folder={`${vendor.id}/products`} value={imageUrls} onChange={setImageUrls} />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Promo video URL (optional)</FormLabel>
                      <Input placeholder="https://... (YouTube, Vimeo or MP4)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                    </div>
                  </div>

                  {/* Advanced options */}
                  <div className="space-y-2">
                    <Button type="button" variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
                      {showAdvanced ? 'Hide' : 'Show'} advanced options
                    </Button>
                    {showAdvanced && (
                      <div className="space-y-6 rounded-md border p-4 bg-muted/20">
                        <div className="text-sm font-medium text-muted-foreground">Advanced Settings</div>
                        
                        {/* Pickup location */}
                        <div className="space-y-4">
                          <div className="text-sm font-medium">Pickup Location</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="pickup_lat"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Latitude</FormLabel>
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
                                  <FormLabel>Longitude</FormLabel>
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
                        </div>

                        {/* Additional categories */}
                        <div className="space-y-2">
                          <FormLabel>Additional Categories (optional)</FormLabel>
                          <ScrollArea className="h-32 rounded-md border p-2">
                            <div className="grid gap-2">
                              {availableCategories.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No categories available.</div>
                              ) : (
                                availableCategories.map((c) => {
                                  const checked = selectedCategoryIds.includes(c.id);
                                  return (
                                    <label key={c.id} className="flex items-center gap-2 rounded-md p-1 cursor-pointer hover:bg-muted/50">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => {
                                          setSelectedCategoryIds((prev) =>
                                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                          );
                                        }}
                                      />
                                      <span className="text-sm">{c.name}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </ScrollArea>
                          <p className="text-xs text-muted-foreground">Select multiple categories for better discoverability</p>
                        </div>

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
                                    <SelectItem value="inactive">Draft (not visible)</SelectItem>
                                    <SelectItem value="active">Published (visible to buyers)</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Prep time and weight */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="prep_time_minutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prep time (minutes)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={0} placeholder="e.g. 15" {...field} />
                                </FormControl>
                                <FormDescription>For prepared food</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="weight_grams"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (grams)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={0} placeholder="e.g. 500" {...field} />
                                </FormControl>
                                <FormDescription>For shipping calculations</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : (isEditing ? "Update Product" : "Create Product")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate("/vendor/dashboard")}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How your product will appear to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imageUrls.length > 0 && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrls[0]}
                      alt={form.watch("name") || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{form.watch("name") || "Product Name"}</h3>
                  <p className="text-muted-foreground text-sm">{form.watch("category") || "Category"}</p>
                  <p className="font-bold text-xl">
                    RM {parseFloat(form.watch("price") || "0").toFixed(2)}
                  </p>
                  <p className="text-sm mt-2">
                    Stock: {form.watch("stock_qty") || "0"} units
                  </p>
                  {form.watch("description") && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {form.watch("description").substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;