import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { fetchEasyParcelRates } from "@/lib/shipping";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Cart() {
  const cart = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  useMemo(() => setSEO("Cart | CoopMarket", "Review your items and checkout securely."), []);

  // Shipping state
  type RateOption = { id: string; courier: string; service: string; price_cents: number; etd?: string; raw?: any };
  const [pickPostcode, setPickPostcode] = useState("");
  const [pickState, setPickState] = useState("");
  const [pickCountry, setPickCountry] = useState("MY");
  const [sendPostcode, setSendPostcode] = useState("");
  const [sendState, setSendState] = useState("");
  const [sendCountry, setSendCountry] = useState("MY");
  const [weight, setWeight] = useState<number>(1);
  const [length, setLength] = useState<number | undefined>(undefined);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [rates, setRates] = useState<RateOption[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  // Load buyer registered address from profiles
  const [profile, setProfile] = useState<{ address_line1?: string | null; address_line2?: string | null; city?: string | null; state?: string | null; postcode?: string | null; country?: string | null } | null>(null);
  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) return; // guest carts can still browse
      // Ensure a profile row exists
      const { data: prof, error } = await supabase.from("profiles").select("address_line1,address_line2,city,state,postcode,country").eq("id", uid).maybeSingle();
      if (error) return; // silent; user can still edit later
      if (!prof) {
        await supabase.from("profiles").insert({ id: uid });
        setProfile({ country: "MY" });
      } else {
        setProfile(prof as any);
        setSendPostcode((prof as any)?.postcode || "");
        setSendState((prof as any)?.state || "");
        setSendCountry((prof as any)?.country || "MY");
      }
    })();
  }, []);

  const fmt = (cents: number) =>
    new Intl.NumberFormat((cart.currency || "USD").toUpperCase() === "MYR" ? "ms-MY" : "en-US", {
      style: "currency",
      currency: (cart.currency || "USD").toUpperCase(),
    }).format((cents || 0) / 100);

  const selectedRate = useMemo(() => rates.find((r) => r.id === selectedRateId) || null, [rates, selectedRateId]);
  const shippingCents = selectedRate?.price_cents ?? 0;
  const totalCents = cart.subtotal_cents + shippingCents;

  const toCents = (v: any) => {
    const n = Number(String(v ?? "").toString().replace(/[^0-9.]/g, ""));
    return Math.round((isNaN(n) ? 0 : n) * 100);
  };
  const flatten = (x: any): any[] => Array.isArray(x) ? x.flatMap(flatten) : (typeof x === "object" && x ? Object.values(x).flatMap(flatten) : []);
  const parseRates = (payload: any): RateOption[] => {
    const arr = flatten(payload).filter((it: any) => typeof it === "object");
    const options: RateOption[] = [];
    let i = 0;
    for (const it of arr) {
      const price_cents = toCents((it.price ?? it.rate ?? it.total ?? it.fee));
      const courier = String(it.courier || it.courier_name || it.provider || it.company || it.name || it.service_id || "Courier");
      const service = String(it.service || it.desc || it.service_name || it.plan || "");
      const etd = (it.etd || it.delivery || it.estimated_delivery_time) as string | undefined;
      if (price_cents > 0) {
        options.push({ id: `${courier}-${service}-${i++}`.replace(/\s+/g, "-"), courier, service, price_cents, etd, raw: it });
      }
    }
    return options;
  };

  const getRates = async () => {
    if (!pickPostcode || !weight || !sendPostcode) {
      if (!sendPostcode) {
        toast("Add your address", { description: "Please set your shipping address in Profile first." });
      } else {
        toast("Enter shipping details", { description: "Pickup postcode and weight are required." });
      }
      return;
    }
    try {
      setLoadingRates(true);
      const res = await fetchEasyParcelRates({
        pick_postcode: pickPostcode,
        pick_state: pickState || undefined,
        pick_country: pickCountry || "MY",
        send_postcode: sendPostcode,
        send_state: sendState || undefined,
        send_country: sendCountry || "MY",
        weight: Number(weight) || 1,
        length: length || undefined,
        width: width || undefined,
        height: height || undefined,
        domestic: (pickCountry || "MY") === (sendCountry || "MY"),
        cod: false,
      });
      const opts = parseRates((res as any)?.data ?? (res as any));
      setRates(opts);
      setSelectedRateId(opts[0]?.id ?? null);
      if (!opts.length) toast("No rates found", { description: "Try adjusting weight or postcodes." });
    } catch (e: any) {
      toast("Rate lookup failed", { description: e.message || String(e) });
    } finally {
      setLoadingRates(false);
    }
  };

  const checkout = async () => {
    try {
      if (cart.items.length === 0) return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast("Sign in required", { description: "Create an account to checkout." });
        window.location.href = "/auth";
        return;
      }
      if (!cart.vendor_id || !cart.community_id || !cart.currency) {
        toast("Cart issue", { description: "Invalid cart context. Please clear and try again." });
        return;
      }
      setCheckingOut(true);
      if (!selectedRate) {
        toast("Select a shipping option", { description: "Fetch rates and choose a courier before checkout." });
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Cart purchase (${cart.count} item${cart.count > 1 ? "s" : ""})`,
          amount_cents: totalCents,
          currency: cart.currency,
          success_path: "/payment-success",
          cancel_path: "/payment-canceled",
          vendor_id: cart.vendor_id,
          community_id: cart.community_id,
        },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.open(url, "_blank");
    } catch (e: any) {
      toast("Unable to checkout", { description: e.message || String(e) });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <main className="container py-6 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold">Your Cart</h1>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm md:text-base">Items are reserved for a limited time. Complete checkout to confirm.</p>

      {cart.items.length === 0 ? (
        <Card className="mt-6 md:mt-8">
          <CardContent className="py-8 md:py-10 text-center text-muted-foreground">Your cart is empty.</CardContent>
        </Card>
      ) : (
        <div className="mt-6 md:mt-8 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {cart.items.map((it) => (
                  <div key={it.product_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm md:text-base leading-tight">{it.name}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">{fmt(it.price_cents)} each</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => cart.remove(it.product_id)}
                        className="shrink-0 h-8 px-3 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label htmlFor={`qty-${it.product_id}`} className="text-sm font-medium">Qty:</label>
                        <Input
                          id={`qty-${it.product_id}`}
                          type="number"
                          min={1}
                          max={999}
                          className="w-16 h-8 text-sm"
                          value={it.quantity}
                          onChange={(e) => cart.updateQty(it.product_id, Number(e.target.value))}
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm md:text-base">{fmt(it.price_cents * it.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:row-start-2 lg:col-start-3">
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pick" className="text-sm font-medium">Pickup postcode</Label>
                  <Input id="pick" value={pickPostcode} onChange={(e) => setPickPostcode(e.target.value)} placeholder="e.g. 31650" className="mt-1" />
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="font-medium text-sm">Shipping to</div>
                  <div className="text-muted-foreground text-sm mt-1">
                    {profile?.address_line1 || profile?.postcode ? (
                      <>
                        {[profile?.address_line1, profile?.address_line2, profile?.city, profile?.state, profile?.postcode, profile?.country]
                          .filter(Boolean)
                          .join(", ")}
                      </>
                    ) : (
                      "No address saved yet"
                    )}
                  </div>
                  <div className="mt-2">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <Link to="/profile">Edit address</Link>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
                    <Input id="weight" type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="length" className="text-xs">L (cm)</Label>
                    <Input id="length" type="number" min={0} value={length ?? ""} onChange={(e) => setLength(e.target.value === "" ? undefined : Number(e.target.value))} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="width" className="text-xs">W (cm)</Label>
                    <Input id="width" type="number" min={0} value={width ?? ""} onChange={(e) => setWidth(e.target.value === "" ? undefined : Number(e.target.value))} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs">H (cm)</Label>
                    <Input id="height" type="number" min={0} value={height ?? ""} onChange={(e) => setHeight(e.target.value === "" ? undefined : Number(e.target.value))} className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Button variant="secondary" onClick={getRates} disabled={loadingRates} className="w-full sm:w-auto">
                    {loadingRates ? "Fetching rates…" : "Get rates"}
                  </Button>
                </div>
                {rates.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select a courier</Label>
                    <RadioGroup value={selectedRateId ?? ""} onValueChange={(v) => setSelectedRateId(v)} className="space-y-2">
                      {rates.map((r) => (
                        <div key={r.id} className="flex items-start gap-3 rounded-md border p-3">
                          <RadioGroupItem id={r.id} value={r.id} className="mt-0.5" />
                          <Label htmlFor={r.id} className="flex-1 cursor-pointer text-sm leading-tight">
                            <div className="font-medium">{r.courier}</div>
                            <div className="text-muted-foreground">{r.service}</div>
                            <div className="font-semibold mt-1">{fmt(r.price_cents)}</div>
                            {r.etd && <div className="text-xs text-muted-foreground mt-1">{r.etd}</div>}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:row-start-1 lg:col-start-3">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cart.count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{fmt(cart.subtotal_cents)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">{shippingCents ? fmt(shippingCents) : "—"}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-lg md:text-xl font-semibold">{fmt(totalCents)}</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button variant="hero" onClick={checkout} disabled={checkingOut} className="w-full">
                    {checkingOut ? "Redirecting…" : "Checkout"}
                  </Button>
                  <Button variant="ghost" onClick={cart.clear} className="w-full">Clear cart</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </main>
  );
}
