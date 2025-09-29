import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check } from "lucide-react";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCommunity } from "@/context/CommunityContext";
import { logAudit } from "@/lib/audit";
import CommunityMembershipCard from "@/components/communities/CommunityMembershipCard";
import AvailableCommunityCard from "@/components/communities/AvailableCommunityCard";

interface Community { id: string; name: string; description: string | null; member_discount_percent: number; coop_fee_percent: number; community_fee_percent: number }

type MemberType = 'buyer' | 'vendor' | 'delivery' | 'manager';

export default function Communities() {
  const { user, isAdmin, isSuperadmin } = useAuthRoles();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form (admins only)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberDiscount, setMemberDiscount] = useState<number>(10);
  const [coopFee, setCoopFee] = useState<number>(2);
  const [communityFee, setCommunityFee] = useState<number>(3);
  const canManage = isAdmin || isSuperadmin;
  const [myMemberships, setMyMemberships] = useState<{ id: string; community_id: string; member_type: MemberType; }[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const { selected, setSelected } = useCommunity();

  // Helper functions for membership status
  const getUserRoleInCommunity = (communityId: string, memberType: MemberType) => {
    return myMemberships.find(m => m.community_id === communityId && m.member_type === memberType);
  };

  const getUserRolesInCommunity = (communityId: string) => {
    return myMemberships.filter(m => m.community_id === communityId).map(m => m.member_type);
  };

  // Group memberships by community
  const groupedMemberships = myMemberships.reduce((acc, membership) => {
    if (!acc[membership.community_id]) {
      acc[membership.community_id] = [];
    }
    acc[membership.community_id].push(membership);
    return acc;
  }, {} as Record<string, typeof myMemberships>);

  const getButtonState = (communityId: string, memberType: MemberType) => {
    const hasRole = getUserRoleInCommunity(communityId, memberType);
    const userRoles = getUserRolesInCommunity(communityId);
    
    if (hasRole) {
      return { 
        text: `${memberType.charAt(0).toUpperCase() + memberType.slice(1)}`,
        variant: 'default' as const,
        icon: true,
        disabled: true
      };
    } else if (userRoles.length > 0) {
      return { 
        text: `Switch to ${memberType.charAt(0).toUpperCase() + memberType.slice(1)}`,
        variant: 'outline' as const,
        icon: false,
        disabled: false
      };
    } else {
      return { 
        text: `Join as ${memberType.charAt(0).toUpperCase() + memberType.slice(1)}`,
        variant: 'outline' as const,
        icon: false,
        disabled: false
      };
    }
  };

  useEffect(() => {
    setSEO("Communities — CoopMarket", "Discover communities to join and save, or create one if you are an admin.");
    load();
  }, []);

  useEffect(() => {
    const loadMemberships = async () => {
      if (!user) { setMyMemberships([]); setLoadingMemberships(false); return; }
      setLoadingMemberships(true);
      const { data, error } = await supabase
        .from("community_members")
        .select("id, community_id, member_type")
        .eq("user_id", user.id);
      if (!error) setMyMemberships((data as any[]) || []);
      setLoadingMemberships(false);
    };
    loadMemberships();
  }, [user]);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select("id,name,description,member_discount_percent,coop_fee_percent,community_fee_percent")
        .order("name");
      if (error) throw error;
      setCommunities((data || []) as any);
    } catch (e: any) {
      toast("Failed to load communities", { description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (communityId: string, memberType: MemberType) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      // Check existing membership
      const { data: existing, error: existingErr } = await supabase
        .from("community_members")
        .select("id, member_type")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (existingErr) throw existingErr;

      if (existing) {
        if (existing.member_type === memberType) {
          toast.info(`Already a member as ${memberType}`);
        } else {
          const { error: updateErr } = await supabase
            .from("community_members")
            .update({ member_type: memberType })
            .eq("id", existing.id);
          if (updateErr) throw updateErr;
          toast.success(`Updated your role to ${memberType}`);
        }
      } else {
        // Insert new membership
        const { error: memberError } = await supabase
          .from("community_members")
          .insert({ community_id: communityId, user_id: user.id, member_type: memberType });
        if (memberError) throw memberError;
        toast.success(`Joined as ${memberType}`);
      }

      // Ensure vendor profile exists when joining as vendor
      if (memberType === 'vendor') {
        const { data: vendor, error: vSelErr } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .eq("community_id", communityId)
          .limit(1)
          .maybeSingle();
        if (vSelErr) throw vSelErr;
        if (!vendor) {
          const { error: vendorError } = await supabase
            .from("vendors")
            .insert({ user_id: user.id, community_id: communityId, display_name: user.email?.split('@')[0] || 'Vendor' });
          if (vendorError) throw vendorError;
        }
      }

      // Audit log
      logAudit('community.join', 'community', communityId, { memberType });

      // Refresh memberships
      const { data: refreshed } = await supabase
        .from("community_members")
        .select("id, community_id, member_type")
        .eq("user_id", user.id);
      setMyMemberships((refreshed as any[]) || []);

      navigate("/profile");
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes("duplicate")) {
        toast("Already a member", { description: "You already joined this community." });
      } else if (msg.toLowerCase().includes("row-level security")) {
        toast("Permission denied", { description: "Please sign in first." });
      } else {
        toast("Unable to join", { description: msg });
      }
    }
  };

  const handleLeave = async (membershipId: string, communityId: string) => {
    try {
      const { error } = await supabase.from("community_members").delete().eq("id", membershipId);
      if (error) throw error;
      setMyMemberships((prev) => prev.filter((m) => m.id !== membershipId));
      toast.success("Left community");
      logAudit('community.leave', 'community', communityId);
    } catch (e: any) {
      toast("Unable to leave", { description: e?.message || String(e) });
    }
  };

  const handleSetActive = (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    setSelected({ id: communityId, name: community?.name ?? null });
    toast.success(`Active community set to ${community?.name || 'Selected'}`);
  };

  const handleCreate = async () => {
    if (!canManage) return;
    if (!name.trim()) {
      toast("Name is required");
      return;
    }
    try {
      const { error } = await supabase.from("communities").insert({
        name: name.trim(),
        description: description.trim() || null,
        member_discount_percent: memberDiscount,
        coop_fee_percent: coopFee,
        community_fee_percent: communityFee,
      });
      if (error) throw error;
      toast.success("Community created");
      setName(""); setDescription(""); setMemberDiscount(10); setCoopFee(2); setCommunityFee(3);
      // Audit log
      logAudit('community.create', 'community', null, { name });
      load();
    } catch (e: any) {
      toast("Failed to create community", { description: e.message || String(e) });
    }
  };

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Communities</h1>
          <p className="text-sm text-muted-foreground">Join a community to unlock member discounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link to="/catalog">Browse Catalog</Link>
          </Button>
        </div>
      </header>

      {canManage && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create a Community</CardTitle>
            <CardDescription>Admins only</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KL Central" />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="md">Member Discount %</Label>
              <Input id="md" type="number" min={0} max={100} value={memberDiscount} onChange={(e) => setMemberDiscount(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf">Coop Fee %</Label>
              <Input id="cf" type="number" min={0} max={100} value={coopFee} onChange={(e) => setCoopFee(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cmf">Community Fee %</Label>
              <Input id="cmf" type="number" min={0} max={100} value={communityFee} onChange={(e) => setCommunityFee(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(user && (loadingMemberships || myMemberships.length > 0)) && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Communities</h2>
            <p className="text-sm text-muted-foreground">
              Communities you've joined and your roles within them
            </p>
          </div>
          
          {loadingMemberships ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading your communities...</span>
                </div>
              </CardContent>
            </Card>
          ) : Object.keys(groupedMemberships).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowRight className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No communities yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join a community below to start saving with member discounts and connect with local vendors.
                  </p>
                  <Button variant="outline" onClick={() => {
                    document.querySelector('#available-communities')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}>
                    Browse Communities
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(groupedMemberships).map(([communityId, memberships]) => {
                const community = communities.find(c => c.id === communityId);
                const isActive = selected.id === communityId;
                
                if (!community) return null;
                
                return (
                  <CommunityMembershipCard
                    key={communityId}
                    community={community}
                    memberships={memberships}
                    isActive={isActive}
                    onSetActive={() => handleSetActive(communityId)}
                    onLeave={(membershipId) => handleLeave(membershipId, communityId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      <div id="available-communities">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Discover Communities</h2>
          <p className="text-sm text-muted-foreground">
            Join communities to unlock member discounts and connect with local vendors
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading communities...</span>
              </div>
            </CardContent>
          </Card>
        ) : communities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No communities available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {canManage ? (
                    "Use the form above to create the first community."
                  ) : (
                    "Communities will appear here once they're created by an admin."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {communities.map((community) => (
              <AvailableCommunityCard
                key={community.id}
                community={community}
                user={user}
                getButtonState={getButtonState}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}