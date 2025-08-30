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
import { ArrowLeft, CalendarIcon, Package, DollarSign, Image, Truck, Settings } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import MapPicker from "@/components/map/MapPicker";
const DIETARY_OPTIONS = [
  "vegan",
  "vegetarian", 
  "gluten-free",
  "halal",
  "kosher",
  "organic",
] as const;

const CONDITION_OPTIONS = [
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
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
  product_kind: z.enum(["prepared_food","packaged_food","grocery","other","preloved"]).default("other"),
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
  // Preloved-specific fields
  condition: z.enum(["like_new", "excellent", "good", "fair", "poor"]).optional(),
  age_years: z.string().optional(),
  original_price: z.string().optional(),
  wear_description: z.string().optional(),
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
      console.log("Fetching vendor and categories data...");
      
      // Get vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorError) {
        console.error("Vendor error:", vendorError);
        throw vendorError;
      }

      if (!vendorData) {
        toast.error("You don't have a vendor profile. Please join as a vendor first.");
        navigate("/getting-started");
        return;
      }

      setVendor(vendorData);
      console.log("Vendor loaded:", vendorData);

      // Load available categories (product/both types only)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, slug, type, parent_id, sort_order, is_active")
        .eq("is_active", true)
        .in("type", ["product", "products", "both"])
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
        
      if (categoriesError) {
        console.error("Categories error:", categoriesError);
        throw categoriesError;
      }

      const catList = categoriesData as Category[] || [];
      console.log("Categories loaded:", catList);
      setAvailableCategories(catList);
      
      // Set default category if creating new product
      if (!isEditing && catList.length > 0 && !form.getValues("category")) {
        form.setValue("category", catList[0].slug);
        // Also select in multi-category
        setSelectedCategoryIds([catList[0].id]);
        console.log("Set default category:", catList[0].slug);
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
          category: (productData as any).category || "",
          product_kind: (productData as any).product_kind || "grocery",
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
          // Preloved fields
          condition: (productData as any).condition || undefined,
          age_years: (productData as any).age_years?.toString() || "",
          original_price: (productData as any).original_price_cents ? ((productData as any).original_price_cents / 100).toFixed(2) : "",
          wear_description: (productData as any).wear_description || "",
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
        // Preloved-specific fields
        condition: data.product_kind === 'preloved' ? data.condition : null,
        age_years: data.product_kind === 'preloved' && data.age_years ? parseInt(data.age_years, 10) : null,
        original_price_cents: data.product_kind === 'preloved' && data.original_price ? Math.round(parseFloat(data.original_price) * 100) : null,
        wear_description: data.product_kind === 'preloved' ? data.wear_description : null,
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
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendor/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isEditing ? 'Edit Product' : 'Create New Product'}
                </CardTitle>
                <CardDescription>
                  {isEditing 
                    ? 'Update your product details and pricing'
                    : 'Add a new product to your marketplace listing'
                  }
                </CardDescription>
              </CardHeader>
            </Card>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Section 1: Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Essential details about your product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Fresh tomatoes, Chicken curry" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your product, ingredients, storage instructions..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Help customers understand what makes your product special
                          </FormDescription>
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
                              <SelectItem value="inactive">Draft (not visible to customers)</SelectItem>
                              <SelectItem value="active">Published (visible to customers)</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Section 2: Category & Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="h-5 w-5" />
                      Category & Type
                    </CardTitle>
                    <CardDescription>Classify your product for better discovery</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-select this category in the multi-select too
                            const selectedCat = availableCategories.find(c => c.slug === value);
                            if (selectedCat && !selectedCategoryIds.includes(selectedCat.id)) {
                              setSelectedCategoryIds(prev => [...prev, selectedCat.id]);
                            }
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  availableCategories.length === 0 
                                    ? "Loading categories..." 
                                    : "Choose the main category"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableCategories.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">No categories available</div>
                              ) : (
                                availableCategories.map((c) => (
                                  <SelectItem key={c.id} value={c.slug}>
                                    {c.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the primary category that best describes your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="product_kind"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type *</FormLabel>
                          <Select onValueChange={(v) => {
                            field.onChange(v);
                            // Auto-apply sensible defaults
                            if (v === 'prepared_food') {
                              form.setValue('allow_easyparcel', false);
                              form.setValue('allow_rider_delivery', true);
                              form.setValue('perishable', true);
                              if (!form.getValues('prep_time_minutes')) form.setValue('prep_time_minutes', '15');
                              toast.success("Applied settings for prepared food: rider delivery only, perishable");
                            } else if (v === 'packaged_food') {
                              form.setValue('allow_easyparcel', true);
                              form.setValue('allow_rider_delivery', true);
                              form.setValue('perishable', false);
                              form.setValue('refrigeration_required', false);
                              toast.success("Applied settings for packaged food: all shipping options enabled");
                            } else if (v === 'grocery') {
                              form.setValue('allow_easyparcel', true);
                              form.setValue('allow_rider_delivery', true);
                              toast.success("Applied settings for grocery: all shipping options enabled");
                            }
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="What type of product is this?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prepared_food">🍜 Prepared Food (hot meals, cooked dishes)</SelectItem>
                              <SelectItem value="packaged_food">📦 Packaged Food (shelf-stable, canned)</SelectItem>
                              <SelectItem value="grocery">🥬 Fresh Groceries (fruits, vegetables)</SelectItem>
                              <SelectItem value="preloved">♻️ Preloved/Second-hand</SelectItem>
                              <SelectItem value="other">📱 Other Products</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This determines shipping options automatically
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Additional categories */}
                    {availableCategories.length > 0 && (
                      <div className="space-y-2">
                        <FormLabel>Additional Categories (optional)</FormLabel>
                        <ScrollArea className="h-32 rounded-md border p-3">
                          <div className="space-y-2">
                            {availableCategories.map((c) => {
                              const checked = selectedCategoryIds.includes(c.id);
                              return (
                                <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
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
                            })}
                          </div>
                        </ScrollArea>
                        <FormDescription>
                          Select multiple categories to improve product discoverability
                        </FormDescription>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 3: Pricing & Stock */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5" />
                      Pricing & Stock
                    </CardTitle>
                    <CardDescription>Set your product pricing and inventory</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (MYR) *</FormLabel>
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
                            <FormLabel>Stock Quantity *</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} placeholder="e.g. 20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="myr">MYR (RM)</SelectItem>
                                <SelectItem value="usd">USD ($)</SelectItem>
                                <SelectItem value="eur">EUR (€)</SelectItem>
                                <SelectItem value="gbp">GBP (£)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 4: Media */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Image className="h-5 w-5" />
                      Product Media
                    </CardTitle>
                    <CardDescription>Add photos and videos to showcase your product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <FormLabel>Product Images</FormLabel>
                      <MediaUploader 
                        bucket="product-images" 
                        folder={`${vendor.id}/products`} 
                        value={imageUrls} 
                        onChange={setImageUrls} 
                      />
                      <FormDescription>
                        Upload high-quality images that show your product clearly
                      </FormDescription>
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel>Promo Video URL (optional)</FormLabel>
                      <Input 
                        placeholder="https://... (YouTube, Vimeo or MP4)" 
                        value={videoUrl} 
                        onChange={(e) => setVideoUrl(e.target.value)} 
                      />
                      <FormDescription>
                        Add a video to better showcase your product
                      </FormDescription>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 5: Shipping & Handling */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-5 w-5" />
                      Shipping & Handling
                    </CardTitle>
                    <CardDescription>Configure how your product will be delivered</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Shipping options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="allow_easyparcel"
                        render={({ field }) => {
                          const pk = form.watch('product_kind');
                          const perishable = form.watch('perishable');
                          const disableEP = pk === 'prepared_food' || (pk === 'grocery' && perishable === true);
                          return (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>EasyParcel Shipping</FormLabel>
                                <FormDescription>
                                  {disableEP ? 'Disabled for prepared food or perishable groceries' : 'Enable courier shipping'}
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
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Rider Delivery</FormLabel>
                              <FormDescription>Local delivery by riders</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Handling properties */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="perishable"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
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
                                    toast.success("Switched to rider delivery only for perishable grocery");
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
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Refrigeration Required</FormLabel>
                              <FormDescription>Needs cold storage</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Package dimensions (for EasyParcel) */}
                    {form.watch('allow_easyparcel') && (
                      <div className="space-y-4">
                        <Separator />
                        <div>
                          <FormLabel>Package Dimensions (for shipping calculation)</FormLabel>
                          <FormDescription>Required for EasyParcel shipping rates</FormDescription>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="length_cm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Length (cm)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={0} placeholder="20" {...field} />
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
                                  <Input type="number" min={0} placeholder="15" {...field} />
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
                                  <Input type="number" min={0} placeholder="10" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="weight_grams"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={0} placeholder="500" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Prep time for prepared food */}
                    {form.watch('product_kind') === 'prepared_food' && (
                      <FormField
                        control={form.control}
                        name="prep_time_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preparation Time (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} placeholder="15" {...field} />
                            </FormControl>
                            <FormDescription>
                              How long does it take to prepare this food item?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Section 6: Additional Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="h-5 w-5" />
                      Additional Details
                    </CardTitle>
                    <CardDescription>Optional details to enhance your product listing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Best before date for perishables */}
                    {form.watch("perishable") && (
                      <FormField
                        control={form.control}
                        name="best_before"
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel>Best Before Date (optional)</FormLabel>
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
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  field.onChange(v ? new Date(v + "T00:00:00") : undefined);
                                }}
                                placeholder="YYYY-MM-DD"
                                className="w-full sm:w-[240px]"
                              />
                            </div>
                            <FormDescription>This will be displayed in the product description</FormDescription>
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
                          <FormLabel>Dietary Tags (optional)</FormLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {DIETARY_OPTIONS.map((opt) => {
                              const checked = Array.isArray(field.value) && field.value.includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
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
                          <FormDescription>These will be added to your product description</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preloved-specific fields */}
                    {form.watch('product_kind') === 'preloved' && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div>
                            <FormLabel className="text-base font-medium">Preloved Item Details</FormLabel>
                            <FormDescription>Provide details about the condition and history of this item</FormDescription>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="condition"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Item Condition *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select condition" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {CONDITION_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="age_years"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age (years)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={0} max={100} placeholder="2" {...field} />
                                  </FormControl>
                                  <FormDescription>How old is the item?</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="original_price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Original Price (optional)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={0} step="0.01" placeholder="150.00" {...field} />
                                </FormControl>
                                <FormDescription>What was the original retail price when new?</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="wear_description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Wear & Defects Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe any visible wear, scratches, stains, or defects..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>Be honest about any imperfections to build trust with buyers</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {/* Pickup location */}
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <FormLabel>Pickup Location (optional)</FormLabel>
                        <FormDescription>
                          Set specific pickup coordinates for this product. Recommended if you enable Rider Delivery.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="pickup_lat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude</FormLabel>
                              <FormControl>
                                <Input type="number" step="any" placeholder="3.139" {...field} />
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
                                <Input type="number" step="any" placeholder="101.6869" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end">
                          <Button type="button" variant="outline" className="w-full" onClick={fillPickupFromProfile}>
                            Use My Profile Location
                          </Button>
                        </div>
                      </div>

                      {/* Interactive map picker */}
                      <MapPicker
                        value={{
                          latitude: form.watch("pickup_lat") ? parseFloat(form.watch("pickup_lat") as string) : undefined,
                          longitude: form.watch("pickup_lng") ? parseFloat(form.watch("pickup_lng") as string) : undefined,
                        }}
                        onChange={(coords) => {
                          form.setValue("pickup_lat", String(coords.latitude));
                          form.setValue("pickup_lng", String(coords.longitude));
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit buttons */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : (isEditing ? "Update Product" : "Create Product")}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => navigate("/vendor/dashboard")}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
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
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {form.watch("name") || "Product Name"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {availableCategories.find(c => c.slug === form.watch("category"))?.name || "Category"}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {form.watch("product_kind")?.replace("_", " ") || "Type"}
                      </span>
                    </div>
                    <p className="font-bold text-xl text-primary">
                      RM {parseFloat(form.watch("price") || "0").toFixed(2)}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>Stock: {form.watch("stock_qty") || "0"} units</p>
                      <p>Status: {form.watch("status") === "active" ? "Published" : "Draft"}</p>
                    </div>
                    {form.watch("description") && (
                      <p className="text-sm text-muted-foreground">
                        {form.watch("description").substring(0, 100)}
                        {form.watch("description").length > 100 ? "..." : ""}
                      </p>
                    )}
                    
                    {/* Shipping info */}
                    <div className="text-xs space-y-1 pt-2 border-t">
                      <p className="font-medium">Shipping Options:</p>
                      {form.watch("allow_easyparcel") && <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-1">EasyParcel</span>}
                      {form.watch("allow_rider_delivery") && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Rider</span>}
                      
                      {form.watch("perishable") && (
                        <p className="text-orange-600">⚠️ Perishable item</p>
                      )}
                      {form.watch("refrigeration_required") && (
                        <p className="text-blue-600">❄️ Requires refrigeration</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;