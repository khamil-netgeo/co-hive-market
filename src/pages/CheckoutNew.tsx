import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useCartSync } from "@/hooks/useCartSync";
import { useOrderWorkflow } from "@/hooks/useOrderWorkflow";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, CreditCard, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat?: number;
  lng?: number;
}

export default function CheckoutNew() {
  const cart = useCart();
  const { validateCart, syncToDatabase } = useCartSync();
  const { createOrder, isLoading: orderLoading } = useOrderWorkflow();
  const { checkAvailability } = useInventory();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Malaysia",
  });
  const [notes, setNotes] = useState("");
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Set SEO
  useEffect(() => {
    setSEO("Checkout | CoopMarket", "Complete your order securely");
  }, []);

  // Check authentication and load user data
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error("Please sign in to continue");
        navigate("/auth", { state: { redirect: "/checkout" } });
        return;
      }
      setUser(user);

      // Load user's profile for delivery address
      const { data: profile } = await supabase
        .from('profiles')
        .select('address_line1, city, postcode, latitude, longitude')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setDeliveryAddress(prev => ({
          ...prev,
          street: profile.address_line1 || "",
          city: profile.city || "",
          postal_code: profile.postcode || "",
          lat: profile.latitude,
          lng: profile.longitude,
        }));
      }
    };

    loadUser();
  }, [navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate("/cart");
    }
  }, [cart.items.length, navigate]);

  // Load product images
  useEffect(() => {
    const loadImages = async () => {
      const ids = cart.items.map((i) => i.product_id);
      if (!ids.length) return;

      const { data: products } = await supabase
        .from('products')
        .select('id, image_urls')
        .in('id', ids);

      const imageMap: Record<string, string> = {};
      (products || []).forEach((p: any) => {
        const url = p?.image_urls?.[0];
        if (url) imageMap[p.id] = url;
      });
      setProductImages(imageMap);
    };

    loadImages();
  }, [cart.items]);

  // Validate cart and inventory on load
  useEffect(() => {
    const validate = async () => {
      if (!user || cart.items.length === 0) return;

      setIsValidating(true);
      try {
        // Validate cart against current product data
        await validateCart();

        // Check inventory availability
        for (const item of cart.items) {
          const available = await checkAvailability(item.product_id, item.quantity);
          if (!available) {
            toast.error(`${item.name} is out of stock`);
            cart.remove(item.product_id);
          }
        }

        // Sync validated cart to database
        await syncToDatabase();
      } catch (error) {
        console.error('Cart validation failed:', error);
        toast.error('Failed to validate cart');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [user, validateCart, checkAvailability, syncToDatabase]);

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      deliveryAddress.street.trim() &&
      deliveryAddress.city.trim() &&
      deliveryAddress.postal_code.trim() &&
      cart.items.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create order using the new workflow
      const orderId = await createOrder(deliveryAddress, notes);
      
      if (orderId) {
        // Navigate to payment or order confirmation
        navigate(`/orders/${orderId}`, { 
          state: { 
            orderCreated: true,
            message: "Order created successfully! Proceed with payment." 
          } 
        });
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Failed to create order');
    }
  };

  const formatCurrency = (cents: number) => {
    const currency = cart.currency || "USD";
    return new Intl.NumberFormat(
      currency.toUpperCase() === "MYR" ? "ms-MY" : "en-US",
      {
        style: "currency",
        currency: currency.toUpperCase(),
      }
    ).format(cents / 100);
  };

  if (isValidating) {
    return (
      <main className="container py-6 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Validating your cart...</h2>
            <p className="text-muted-foreground">Please wait while we check product availability</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Checkout
          </h1>
          <p className="text-muted-foreground mt-2">
            Review your order and provide delivery details
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={deliveryAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Enter your street address"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={deliveryAddress.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Postal Code *</Label>
                      <Input
                        id="postal_code"
                        value={deliveryAddress.postal_code}
                        onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                        placeholder="Postal code"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={deliveryAddress.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions for your order..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Mixed vendor warning */}
              {cart.items.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This order contains items from {cart.vendor_id ? '1 vendor' : 'multiple vendors'}. 
                    Items from different vendors will be processed as separate orders.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!isFormValid() || orderLoading}
              >
                {orderLoading ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded border overflow-hidden bg-muted">
                        <img
                          src={productImages[item.product_id] || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price_cents)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(item.price_cents * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items ({cart.count})</span>
                    <span>{formatCurrency(cart.subtotal_cents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>TBD</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(cart.subtotal_cents)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  * Shipping costs will be calculated after order creation
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate("/cart")}
                  className="w-full"
                >
                  Back to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}