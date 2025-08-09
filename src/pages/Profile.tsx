import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import MapPicker from "@/components/map/MapPicker";

interface Membership { community_id: string; member_type: string }
interface Community { id: string; name: string }
interface Vendor { id: string; display_name: string; community_id: string; active: boolean }

export default function Profile() {
  const { user, roles, loading, signOut } = useAuthRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  type ProfileRow = {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  const [profile, setProfile] = useState<ProfileRow>({
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    postcode: null,
    country: "MY",
    phone: null,
    latitude: null,
    longitude: null,
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setSEO("My Profile — CoopMarket", "View your account, roles, memberships, and vendor info.");
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }
      try {
        const [mRes, vRes] = await Promise.all([
          supabase.from("community_members").select("community_id, member_type"),
          supabase.from("vendors").select("id, display_name, community_id, active"),
        ]);
        if (mRes.error) throw mRes.error;
        if (vRes.error) throw vRes.error;
        setMemberships((mRes.data || []) as any);
        setVendors((vRes.data || []) as any);
        const communityIds = Array.from(new Set((mRes.data || []).map((m: any) => m.community_id).concat((vRes.data || []).map((v: any) => v.community_id))));
        if (communityIds.length) {
          const cRes = await supabase.from("communities").select("id,name").in("id", communityIds);
          if (!cRes.error && cRes.data) {
            const map: Record<string, Community> = {};
            cRes.data.forEach((c) => (map[c.id] = c));
            setCommunitiesById(map);
          }
        }
      } finally {
        setLoadingData(false);
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data) {
        const d: any = data as any;
        setProfile({
          address_line1: d.address_line1 ?? null,
          address_line2: d.address_line2 ?? null,
          city: d.city ?? null,
          state: d.state ?? null,
          postcode: d.postcode ?? null,
          country: d.country ?? "MY",
          phone: d.phone ?? null,
          latitude: d.latitude ?? null,
          longitude: d.longitude ?? null,
        });
      }
    };
    load();
  }, [user?.id]);

  const handleSaveAddress = async () => {
    if (!user?.id) return;
    setSaving(true);
    const payload = { id: user.id, ...profile } as any;
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save address", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Address saved", description: "Your address and location were updated." });
    }
  };

  const userIdShort = useMemo(() => user?.id ? `${user.id.slice(0, 8)}…` : "", [user?.id]);

  return (
    <main className="container px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Account overview and quick actions.</p>
      </header>

      {/* Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your basic account info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">Email: <span className="font-medium">{user?.email}</span></div>
            <div className="text-sm">User ID: <span className="font-mono">{userIdShort}</span></div>
            <div className="text-sm flex items-center gap-2">Roles:
              {(roles && roles.length > 0) ? roles.map((r: string) => (
                <Badge key={r} variant="secondary">{r}</Badge>
              )) : <span className="text-muted-foreground">none</span>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="secondary"><Link to="/catalog">Go to Catalog</Link></Button>
              <Button asChild variant="outline"><Link to="/orders">My Orders</Link></Button>
              <Button variant="ghost" onClick={async () => { await signOut(); navigate("/"); }}>Sign out</Button>
            </div>
          </CardContent>
        </Card>

        {/* Memberships */}
        <Card>
          <CardHeader>
            <CardTitle>Community Memberships</CardTitle>
            <CardDescription>Your roles within communities</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : memberships.length === 0 ? (
              <div className="text-sm text-muted-foreground">No memberships yet.
                <Button className="ml-2" size="sm" asChild>
                  <Link to="/getting-started">Join a community</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {memberships.map((m, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium capitalize">{m.member_type}</span>
                      <span className="text-muted-foreground"> in </span>
                      <span>{communitiesById[m.community_id]?.name || m.community_id}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Address & Location */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Address & Location</CardTitle>
            <CardDescription>Save your delivery address and precise map location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address1">Address line 1</Label>
                  <Textarea
                    id="address1"
                    placeholder="Apartment, street, etc."
                    value={profile.address_line1 ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, address_line1: e.target.value || null }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address2">Address line 2</Label>
                  <Input
                    id="address2"
                    value={profile.address_line2 ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, address_line2: e.target.value || null }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profile.state ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value || null }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={profile.postcode ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, postcode: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.country ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value || null }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value || null }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveAddress} disabled={saving}>{saving ? 'Saving…' : 'Save address'}</Button>
                </div>
              </div>
              <div className="space-y-2">
                <MapPicker
                  value={{ latitude: profile.latitude, longitude: profile.longitude }}
                  onChange={({ latitude, longitude }) => setProfile((p) => ({ ...p, latitude, longitude }))}
                />
                <p className="text-xs text-muted-foreground">
                  {profile.latitude && profile.longitude
                    ? `Selected: ${profile.latitude.toFixed(6)}, ${profile.longitude.toFixed(6)}`
                    : 'Pick your location by clicking on the map or use the geolocate control.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Vendor */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor</CardTitle>
            <CardDescription>Manage your vendor account</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : vendors.length === 0 ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                You are not a vendor yet.
                <Button size="sm" asChild>
                  <Link to="/getting-started">Become a vendor</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vendors.map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                    <div className="space-y-0.5">
                      <div className="font-medium">{v.display_name}</div>
                      <div className="text-xs text-muted-foreground">Community: {communitiesById[v.community_id]?.name || v.community_id} • {v.active ? "Active" : "Inactive"}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild variant="secondary"><Link to="/vendor/dashboard">Dashboard</Link></Button>
                      <Button size="sm" asChild variant="outline"><Link to="/vendor/products/new">New Product</Link></Button>
                      <Button size="sm" asChild variant="outline"><Link to="/vendor/orders">Orders</Link></Button>
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
