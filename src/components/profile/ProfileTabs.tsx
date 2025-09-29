import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import AvatarUploader from "@/components/common/AvatarUploader";
import KycUploader from "@/components/kyc/KycUploader";
import KycRequirements from "@/components/kyc/KycRequirements";
import DeliveryPreferenceSelector from "@/components/delivery/DeliveryPreferenceSelector";
import RoleManagementCard from "@/components/profile/RoleManagementCard";
import CommunityRoleStats from "@/components/profile/CommunityRoleStats";
import MapPicker from "@/components/map/MapPicker";
import { User, Settings, Shield, Users, Store, Truck } from "lucide-react";
import useIsVendor from "@/hooks/useIsVendor";
import useIsRider from "@/hooks/useIsRider";

interface ProfileTabsProps {
  user: any;
  roles: string[];
  profile: any;
  setProfile: (profile: any) => void;
  handleSaveAddress: () => void;
  saving: boolean;
  communitiesById: Record<string, any>;
  vendors: any[];
  signOut: () => void;
}

export default function ProfileTabs({
  user,
  roles,
  profile,
  setProfile,
  handleSaveAddress,
  saving,
  communitiesById,
  vendors,
  signOut,
}: ProfileTabsProps) {
  const { isVendor } = useIsVendor();
  const { isRider } = useIsRider();
  const [activeTab, setActiveTab] = useState("overview");

  const userIdShort = user?.id ? `${user.id.slice(0, 8)}…` : "";

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "personal", label: "Personal Info", icon: Settings },
    { id: "identity", label: "Identity", icon: Shield },
    { id: "roles", label: "Roles & Communities", icon: Users },
    ...(isVendor ? [{ id: "vendor", label: "Vendor Settings", icon: Store }] : []),
    ...(isRider ? [{ id: "rider", label: "Rider Settings", icon: Truck }] : []),
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Account Summary */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Summary
              </CardTitle>
              <CardDescription>Your profile overview and quick actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">User ID</span>
                  <p className="font-mono text-sm">{userIdShort}</p>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Active Roles</span>
                <div className="flex flex-wrap gap-2">
                  {(roles && roles.length > 0) ? roles.map((r: string) => (
                    <Badge key={r} variant="secondary">{r}</Badge>
                  )) : <span className="text-muted-foreground italic">No roles assigned</span>}
                </div>
              </div>
              <div className="pt-4 border-t grid gap-2 sm:grid-cols-2">
                <Button variant="outline" asChild>
                  <Link to="/orders">My Orders</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/catalog">Browse Catalog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/getting-started">Join Community</Link>
              </Button>
              {isVendor && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/vendor/products/new">Add Product</Link>
                </Button>
              )}
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Community Stats */}
        <CommunityRoleStats communitiesById={communitiesById} />
      </TabsContent>

      <TabsContent value="personal" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Address & Location</CardTitle>
            <CardDescription>Set your delivery address and precise location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Address Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Textarea
                    id="address1"
                    placeholder="Street address, apartment, unit, etc."
                    value={profile.address_line1 ?? ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, address_line1: e.target.value || null }))}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address2"
                    placeholder="Building, floor, etc."
                    value={profile.address_line2 ?? ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, address_line2: e.target.value || null }))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      value={profile.city ?? ""}
                      onChange={(e) => setProfile((p: any) => ({ ...p, city: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Enter state"
                      value={profile.state ?? ""}
                      onChange={(e) => setProfile((p: any) => ({ ...p, state: e.target.value || null }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      placeholder="Enter postcode"
                      value={profile.postcode ?? ""}
                      onChange={(e) => setProfile((p: any) => ({ ...p, postcode: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Enter country"
                      value={profile.country ?? ""}
                      onChange={(e) => setProfile((p: any) => ({ ...p, country: e.target.value || null }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={profile.phone ?? ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value || null }))}
                  />
                </div>
                <Button onClick={handleSaveAddress} disabled={saving} className="w-full sm:w-auto">
                  {saving ? 'Saving...' : 'Save Address'}
                </Button>
              </div>

              {/* Map Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Precise Location</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on the map to set your exact location
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <MapPicker
                    value={{ latitude: profile.latitude, longitude: profile.longitude }}
                    onChange={({ latitude, longitude }) => setProfile((p: any) => ({ ...p, latitude, longitude }))}
                  />
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                  {profile.latitude && profile.longitude
                    ? `📍 Selected: ${profile.latitude.toFixed(6)}, ${profile.longitude.toFixed(6)}`
                    : '📍 No location selected. Click on the map to set your location.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="identity" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <AvatarUploader />
          <KycUploader />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Role Requirements</CardTitle>
            <CardDescription>Complete verification requirements for your roles</CardDescription>
          </CardHeader>
          <CardContent>
            <KycRequirements role="buyer" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="roles" className="space-y-6">
        <RoleManagementCard 
          communitiesById={communitiesById}
          vendors={vendors}
          ordersCount={0}
          deliveriesCount={0}
        />
      </TabsContent>

      {isVendor && (
        <TabsContent value="vendor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>Manage your vendor accounts and settings</CardDescription>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">You don't have any vendor accounts yet.</p>
                  <Button asChild>
                    <Link to="/getting-started">Become a Vendor</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendors.map((v) => (
                    <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{v.display_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Community: {communitiesById[v.community_id]?.name || v.community_id}
                        </p>
                        <Badge variant={v.active ? "default" : "secondary"}>
                          {v.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" asChild>
                          <Link to="/vendor/dashboard">Dashboard</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/vendor/products/new">Add Product</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {isRider && (
        <TabsContent value="rider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Preferences</CardTitle>
              <CardDescription>Set your delivery and availability preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryPreferenceSelector />
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}