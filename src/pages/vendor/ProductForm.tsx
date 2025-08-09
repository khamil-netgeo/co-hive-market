import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
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
      `${isEditing ? 'Edit' : 'Create'} Product — CoopMarket`,
      `${isEditing ? 'Edit your existing' : 'Create a new'} product listing in the community marketplace.`
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
        form.reset({
          name: productData.name,
          description: productData.description || "",
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
      const productData = {
        name: data.name,
        description: data.description || null,
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
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
                          placeholder="Describe your product..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of your product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                </div>

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
                      <FormDescription>
                        Only active products will be visible to customers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="grocery">Groceries</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose “Groceries” or “Food” to enable delivery options and geo-sorting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Inventory & specs */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="0" {...field} />
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

                {/* Handling */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Pickup location */}
                <div className="grid grid-cols-3 gap-4">
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