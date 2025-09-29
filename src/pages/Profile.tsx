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
import AvatarUploader from "@/components/common/AvatarUploader";
import KycUploader from "@/components/kyc/KycUploader";
import KycRequirements from "@/components/kyc/KycRequirements";
import DeliveryPreferenceSelector from "@/components/delivery/DeliveryPreferenceSelector";
import RoleManagementCard from "@/components/profile/RoleManagementCard";
import CommunityRoleStats from "@/components/profile/CommunityRoleStats";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import SectionLayout from "@/components/layout/SectionLayout";

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
    <PageLayout variant="narrow" background="gradient">
      <PageHeader
        title="My Profile"
        description="Manage your account, roles, and preferences across communities"
        size="large"
        actions={
          <Button asChild variant="default" size="lg" className="w-fit">
            <Link to="/catalog">Browse Catalog</Link>
          </Button>
        }
      />

      {/* Main Content Grid */}
      <div className="space-y-8 lg:space-y-12">
        {/* Top Section - Account Overview & Role Management */}
        <SectionLayout spacing="large">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Account Info - spans 1 column */}
            <Card className="lg:col-span-1 border-2 hover:border-primary/20 transition-colors duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  Account Overview
                </CardTitle>
                <CardDescription>Your account details and quick actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">User ID</span>
                    <span className="font-mono text-sm">{userIdShort}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Active Roles</span>
                    <div className="flex flex-wrap gap-2">
                      {(roles && roles.length > 0) ? roles.map((r: string) => (
                        <Badge key={r} variant="secondary" className="font-medium">{r}</Badge>
                      )) : <span className="text-muted-foreground italic">No roles assigned</span>}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="grid gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/orders">My Orders</Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={async () => { await signOut(); navigate("/"); }}
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Management - spans 2 columns */}
            <div className="lg:col-span-2">
              <RoleManagementCard 
                communitiesById={communitiesById}
                vendors={vendors}
                ordersCount={0}
                deliveriesCount={0}
              />
            </div>
          </div>
        </SectionLayout>

        {/* Community Performance Stats */}
        <SectionLayout>
          <CommunityRoleStats communitiesById={communitiesById} />
        </SectionLayout>

        {/* Identity Verification Section */}
        <SectionLayout
          title="Identity & Verification"
          description="Upload your profile photo and complete identity verification"
        >
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            <AvatarUploader />
            <KycUploader />
          </div>
        </SectionLayout>

        {/* Role Requirements */}
        <SectionLayout>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Role-specific Requirements</CardTitle>
              <CardDescription>Complete additional requirements for your active roles</CardDescription>
            </CardHeader>
            <CardContent>
              <KycRequirements role="buyer" />
            </CardContent>
          </Card>
        </SectionLayout>

        {/* Location & Address */}
        <SectionLayout
          title="Address & Location"
          description="Set your delivery address and precise location for better service"
        >
            <Card className="border-2">
              <CardContent className="p-6 lg:p-8">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                  {/* Address Form */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address1" className="text-base font-medium">Address Line 1</Label>
                        <Textarea
                          id="address1"
                          placeholder="Street address, apartment, unit, etc."
                          value={profile.address_line1 ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, address_line1: e.target.value || null }))}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address2" className="text-base font-medium">Address Line 2 (Optional)</Label>
                        <Input
                          id="address2"
                          placeholder="Building, floor, etc."
                          value={profile.address_line2 ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, address_line2: e.target.value || null }))}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-base font-medium">City</Label>
                          <Input
                            id="city"
                            placeholder="Enter city"
                            value={profile.city ?? ""}
                            onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value || null }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-base font-medium">State</Label>
                          <Input
                            id="state"
                            placeholder="Enter state"
                            value={profile.state ?? ""}
                            onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value || null }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postcode" className="text-base font-medium">Postcode</Label>
                          <Input
                            id="postcode"
                            placeholder="Enter postcode"
                            value={profile.postcode ?? ""}
                            onChange={(e) => setProfile((p) => ({ ...p, postcode: e.target.value || null }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-base font-medium">Country</Label>
                          <Input
                            id="country"
                            placeholder="Enter country"
                            value={profile.country ?? ""}
                            onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value || null }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={profile.phone ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value || null }))}
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleSaveAddress} 
                        disabled={saving}
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {saving ? 'Saving Address...' : 'Save Address'}
                      </Button>
                    </div>
                  </div>

                  {/* Map Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium">Precise Location</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on the map or use the locate button to set your exact location
                      </p>
                    </div>
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden">
                      <MapPicker
                        value={{ latitude: profile.latitude, longitude: profile.longitude }}
                        onChange={({ latitude, longitude }) => setProfile((p) => ({ ...p, latitude, longitude }))}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                      {profile.latitude && profile.longitude
                        ? `📍 Selected coordinates: ${profile.latitude.toFixed(6)}, ${profile.longitude.toFixed(6)}`
                        : '📍 No location selected. Click on the map to set your precise location.'}
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>
        </SectionLayout>

        {/* Vendor Management */}
        <SectionLayout
          title="Vendor Management"
          description="Manage your vendor accounts and store settings"
        >
            <Card className="border-2">
              <CardContent className="p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading vendor information...</div>
                  </div>
                ) : vendors.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="text-muted-foreground">
                      You don't have any vendor accounts yet.
                    </div>
                    <Button size="lg" asChild>
                      <Link to="/getting-started">Become a Vendor</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendors.map((v) => (
                      <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border-2 border-muted/50 hover:border-primary/30 transition-colors">
                        <div className="space-y-2">
                          <div className="font-semibold text-lg">{v.display_name}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Community: {communitiesById[v.community_id]?.name || v.community_id}</span>
                            <Badge variant={v.active ? "default" : "secondary"}>
                              {v.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <Button size="sm" asChild variant="default">
                            <Link to="/vendor/dashboard">Dashboard</Link>
                          </Button>
                          <Button size="sm" asChild variant="outline">
                            <Link to="/vendor/products/new">Add Product</Link>
                          </Button>
                          <Button size="sm" asChild variant="outline">
                            <Link to="/vendor/orders">View Orders</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
        </SectionLayout>

        {/* Delivery Preferences */}
        <SectionLayout
          title="Delivery Preferences"
          description="Configure your delivery and pickup preferences"
        >
          <DeliveryPreferenceSelector />
        </SectionLayout>
      </div>
    </PageLayout>
  );
}
