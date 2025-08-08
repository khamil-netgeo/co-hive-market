import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";

interface Community { id: string; name: string }
interface Vendor { id: string; display_name: string; community_id: string }
interface Plan { id: string; name: string; description: string | null; price_cents: number; currency: string; interval: string; status: string }

export default function VendorPlans() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCommunity, setNewVendorCommunity] = useState<string>("");

  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: "19.90", // UI in RM
    currency: "myr",
    interval: "month",
    status: "active",
  });

  useEffect(() => {
    setSEO(
      "Vendor Plans Manager | CoopMarket",
      "Create and manage your subscription service plans for customers to subscribe to."
    );
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast("Please sign in", { description: "Vendor dashboard requires an account." });
        window.location.replace("/auth");
        return;
      }

      const [commRes, vendRes] = await Promise.all([
        supabase.from("communities").select("id,name").order("name"),
        supabase.from("vendors").select("id,display_name,community_id").order("created_at", { ascending: true }),
      ]);

      if (commRes.error) toast("Failed to load communities", { description: commRes.error.message });
      else setCommunities((commRes.data as any) || []);

      if (vendRes.error) toast("Failed to load vendors", { description: vendRes.error.message });
      else {
        const own = (vendRes.data as Vendor[]) || [];
        setVendors(own);
        if (own.length > 0) {
          setSelectedVendorId(own[0].id);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      if (!selectedVendorId) {
        setPlans([]);
        return;
      }
      const { data, error } = await supabase
        .from("vendor_service_plans")
        .select("id,name,description,price_cents,currency,interval,status")
        .eq("vendor_id", selectedVendorId)
        .order("created_at", { ascending: true });
      if (error) {
        toast("Failed to load plans", { description: error.message });
      } else {
        setPlans((data as any) || []);
      }
    };
    loadPlans();
  }, [selectedVendorId]);

  const canCreateVendor = useMemo(() => communities.length > 0, [communities]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newVendorCommunity) return;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const { error } = await supabase.from("vendors").insert({
      display_name: newVendorName,
      community_id: newVendorCommunity,
      user_id: session.session.user.id,
    });
    if (error) {
      toast("Could not create vendor", { description: error.message });
      return;
    }
    toast("Vendor created");
    setNewVendorName("");
    setNewVendorCommunity("");
    const { data: vend } = await supabase
      .from("vendors")
      .select("id,display_name,community_id")
      .order("created_at", { ascending: true });
    const own = (vend as any) || [];
    setVendors(own);
    if (own.length > 0) setSelectedVendorId(own[own.length - 1].id);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;

    const priceCents = Math.round(parseFloat(newPlan.price.replace(/,/g, "")) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast("Invalid price", { description: "Enter a positive number." });
      return;
    }

    const { error } = await supabase.from("vendor_service_plans").insert({
      vendor_id: selectedVendorId,
      name: newPlan.name,
      description: newPlan.description || null,
      price_cents: priceCents,
      currency: newPlan.currency,
      interval: newPlan.interval,
      status: newPlan.status,
    });
    if (error) {
      toast("Could not create plan", { description: error.message });
      return;
    }
    toast("Plan created");
    setNewPlan({ name: "", description: "", price: "19.90", currency: "myr", interval: "month", status: "active" });
    const { data } = await supabase
      .from("vendor_service_plans")
      .select("id,name,description,price_cents,currency,interval,status")
      .eq("vendor_id", selectedVendorId)
      .order("created_at", { ascending: true });
    setPlans((data as any) || []);
  };

  const handleUpdatePlanStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vendor_service_plans").update({ status }).eq("id", id);
    if (error) {
      toast("Update failed", { description: error.message });
      return;
    }
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    toast("Plan updated");
  };

  const handleDeletePlan = async (id: string) => {
    const { error } = await supabase.from("vendor_service_plans").delete().eq("id", id);
    if (error) {
      toast("Delete failed", { description: error.message });
      return;
    }
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast("Plan deleted");
  };

  if (loading) return <main className="container py-16 text-muted-foreground">Loading…</main>;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-primary" aria-hidden />
            <span className="text-lg font-semibold text-gradient-brand">CoopMarket</span>
          </a>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary"><a href="/">Home</a></Button>
          </div>
        </div>
      </header>

      <section className="container py-12 md:py-16">
        <h1 className="text-3xl font-semibold">Vendor Plans Manager</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">Create and manage your subscription plans. Customers can subscribe from the public Plans page.</p>

        {vendors.length === 0 ? (
          <Card className="mt-8 max-w-2xl">
            <CardHeader>
              <CardTitle>Create your Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              {!canCreateVendor ? (
                <p className="text-sm text-muted-foreground">No communities available yet.</p>
              ) : (
                <form onSubmit={handleCreateVendor} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vendor_name">Display name</Label>
                    <Input id="vendor_name" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Community</Label>
                    <Select value={newVendorCommunity} onValueChange={setNewVendorCommunity}>
                      <SelectTrigger><SelectValue placeholder="Select a community" /></SelectTrigger>
                      <SelectContent>
                        {communities.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button type="submit" variant="hero">Create Vendor</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-8">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Your Vendor</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Choose vendor</Label>
                  <Select value={selectedVendorId ?? undefined} onValueChange={setSelectedVendorId!}>
                    <SelectTrigger><SelectValue placeholder="Select your vendor" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">Managing plans for your selected vendor.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create a plan</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePlan} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (MYR)</Label>
                    <Input inputMode="decimal" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} required />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Interval</Label>
                    <Select value={newPlan.interval} onValueChange={(v) => setNewPlan({ ...newPlan, interval: v })}>
                      <SelectTrigger><SelectValue placeholder="Interval" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={newPlan.status} onValueChange={(v) => setNewPlan({ ...newPlan, status: v })}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" variant="hero" disabled={!selectedVendorId}>Create Plan</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your plans</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No plans created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((p) => (
                      <div key={p.id} className="rounded-md border bg-card p-4">
                        <div className="text-base font-medium">{p.name}</div>
                        {p.description && (
                          <div className="mt-1 text-sm text-muted-foreground">{p.description}</div>
                        )}
                        <div className="mt-2 text-sm">
                          <span className="font-medium">{(p.currency || 'myr').toUpperCase()}</span> •
                          <span className="ml-1">{(p.price_cents / 100).toFixed(2)}</span> / {p.interval}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Select value={p.status} onValueChange={(v) => handleUpdatePlanStatus(p.id, v)}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={() => handleDeletePlan(p.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
