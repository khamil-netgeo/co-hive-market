import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import MapPicker from "@/components/map/MapPicker";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

export default function DeliveryDetails() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postcode: "",
    phone: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSEO("Delivery Details | CoopMarket", "Set your drop-off address for rider delivery.");
    (async () => {
      try {
        const { data: userData, error: uErr } = await supabase.auth.getUser();
        if (uErr || !userData.user) {
          navigate("/auth");
          return;
        }
        const { data: prof } = await supabase
          .from("profiles")
          .select("address_line1,address_line2,city,state,postcode,phone,latitude,longitude")
          .eq("id", userData.user.id)
          .maybeSingle();
        if (prof) {
          setForm({
            address_line1: prof.address_line1 || "",
            address_line2: prof.address_line2 || "",
            city: prof.city || "",
            state: prof.state || "",
            postcode: prof.postcode || "",
            phone: prof.phone || "",
            latitude: prof.latitude ?? null,
            longitude: prof.longitude ?? null,
          });
        }
      } catch (e: any) {
        toast("Error", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canSave = form.address_line1 && form.city && form.postcode && form.latitude != null && form.longitude != null && form.phone;

  const save = async () => {
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        navigate("/auth");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          address_line1: form.address_line1,
          address_line2: form.address_line2 || null,
          city: form.city,
          state: form.state || null,
          postcode: form.postcode,
          phone: form.phone,
          latitude: form.latitude,
          longitude: form.longitude,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast("Saved");
      const redirect = (location.state as any)?.redirect || "/checkout";
      navigate(redirect);
    } catch (e: any) {
      toast("Could not save", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container py-6 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold">Delivery details</h1>
        <p className="mt-2 text-muted-foreground">Enter your drop-off address so we can assign a nearby rider automatically.</p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="address1">Address line 1</Label>
              <Input id="address1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address2">Address line 2 (optional)</Label>
              <Input id="address2" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="grid gap-3">
              <Label>Pin your location</Label>
              <MapPicker
                value={{ latitude: form.latitude, longitude: form.longitude }}
                onChange={({ latitude, longitude }) => setForm({ ...form, latitude, longitude })}
              />
              <p className="text-xs text-muted-foreground">Tap the map to set the exact drop-off point.</p>
            </div>

            <div className="pt-2">
              <Button className="w-full md:w-auto" disabled={!canSave || saving} onClick={save}>
                {saving ? "Saving…" : "Save and continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
