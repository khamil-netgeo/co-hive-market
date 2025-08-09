import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";

export default function ServiceForm() {
  const { user } = useAuthRoles();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("myr");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSEO("New Service — Vendor", "Create a new service offering.");
  }, []);

  const submit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!name.trim() || price <= 0) { toast("Please enter name and price"); return; }
    setSaving(true);
    try {
      // Find vendor for this user
      const { data: vend, error: vErr } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (vErr) throw vErr;
      if (!vend) { toast("No vendor profile", { description: "Join as vendor first." }); navigate("/getting-started"); return; }

      const { error } = await supabase.from("vendor_services").insert({
        vendor_id: (vend as any).id,
        name: name.trim(),
        description: description.trim() || null,
        price_cents: Math.round(price * 100),
        currency: currency || "myr",
      });
      if (error) throw error;
      toast.success("Service created");
      navigate("/vendor/services");
    } catch (e: any) {
      toast("Failed to create service", { description: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container py-8">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>New Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Service name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. School Bus, Home Tutor" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cur">Currency</Label>
              <Input id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="myr" />
            </div>
          </div>
          <div>
            <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create Service"}</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
