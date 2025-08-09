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
    <main className="container py-12 md:py-16">
      <h1 className="text-3xl font-semibold">Your Cart</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">Items are reserved for a limited time. Complete checkout to confirm.</p>

      {cart.items.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-10 text-center text-muted-foreground">Your cart is empty.</CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {cart.items.map((it) => (
                <div key={it.product_id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-sm text-muted-foreground">{fmt(it.price_cents)} each</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor={`qty-${it.product_id}`} className="sr-only">Quantity</label>
                    <Input
                      id={`qty-${it.product_id}`}
                      type="number"
                      min={1}
                      max={999}
                      className="w-20"
                      value={it.quantity}
                      onChange={(e) => cart.updateQty(it.product_id, Number(e.target.value))}
                    />
                    <Button variant="outline" onClick={() => cart.remove(it.product_id)}>Remove</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pick">Pickup postcode</Label>
                <Input id="pick" value={pickPostcode} onChange={(e) => setPickPostcode(e.target.value)} placeholder="e.g. 31650" />
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <div className="font-medium">Shipping to</div>
                <div className="text-muted-foreground">
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
                  <Button asChild variant="outline" size="sm">
                    <Link to="/profile">Edit address</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="length">L (cm)</Label>
                  <Input id="length" type="number" min={0} value={length ?? ""} onChange={(e) => setLength(e.target.value === "" ? undefined : Number(e.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="width">W (cm)</Label>
                  <Input id="width" type="number" min={0} value={width ?? ""} onChange={(e) => setWidth(e.target.value === "" ? undefined : Number(e.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height">H (cm)</Label>
                  <Input id="height" type="number" min={0} value={height ?? ""} onChange={(e) => setHeight(e.target.value === "" ? undefined : Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Button variant="secondary" onClick={getRates} disabled={loadingRates}>
                  {loadingRates ? "Fetching rates…" : "Get rates"}
                </Button>
              </div>
              {rates.length > 0 && (
                <div className="grid gap-2">
                  <Label>Select a courier</Label>
                  <RadioGroup value={selectedRateId ?? ""} onValueChange={(v) => setSelectedRateId(v)}>
                    {rates.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 rounded-md border p-3">
                        <RadioGroupItem id={r.id} value={r.id} />
                        <Label htmlFor={r.id} className="flex-1 cursor-pointer">
                          <span className="font-medium">{r.courier}</span> — <span>{r.service}</span>
                          <span className="ml-2 font-semibold">{fmt(r.price_cents)}</span>
                          {r.etd && <span className="ml-2 text-xs text-muted-foreground">{r.etd}</span>}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{cart.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{fmt(cart.subtotal_cents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">{shippingCents ? fmt(shippingCents) : "—"}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">Total</span>
                <span className="text-xl font-semibold">{fmt(totalCents)}</span>
              </div>
              <Button variant="hero" onClick={checkout} disabled={checkingOut}>
                {checkingOut ? "Redirecting…" : "Checkout"}
              </Button>
              <Button variant="ghost" onClick={cart.clear}>Clear cart</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
