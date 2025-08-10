import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCommunity } from "@/context/CommunityContext";
import { logAudit } from "@/lib/audit";

interface Community { id: string; name: string; description: string | null; member_discount_percent: number; coop_fee_percent: number; community_fee_percent: number }

type MemberType = 'buyer' | 'vendor' | 'delivery';

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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your memberships</CardTitle>
            <CardDescription>Communities you have joined</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMemberships ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : myMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven’t joined any communities yet.</p>
            ) : (
              <div className="space-y-3">
                {myMemberships.map((m) => {
                  const c = communities.find((x) => x.id === m.community_id);
                  const isActive = selected.id === m.community_id;
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/communities/${m.community_id}`} className="font-medium hover:underline">{c?.name ?? 'Community'}</Link>
                        {isActive && <Badge variant="secondary">Active</Badge>}
                        <Badge variant="outline">{m.member_type}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {!isActive && (
                          <Button size="sm" variant="outline" onClick={() => handleSetActive(m.community_id)}>Set active</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleLeave(m.id, m.community_id)}>Leave</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Communities</CardTitle>
          <CardDescription>Publicly visible</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : communities.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No communities yet.
              {canManage ? (
                <span className="ml-1">Use the form above to create one.</span>
              ) : (
                <span className="ml-1">Ask an admin to create one.</span>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {communities.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Link to={`/communities/${c.id}`} className="hover:underline">{c.name}</Link>
                      <Badge variant="outline" className="self-start sm:self-auto">{c.member_discount_percent}% discount</Badge>
                    </CardTitle>
                    <CardDescription>{c.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleJoin(c.id, 'buyer')} disabled={!user} className="w-full sm:w-auto">Join as Buyer</Button>
                      <Button size="sm" onClick={() => handleJoin(c.id, 'vendor')} disabled={!user} className="w-full sm:w-auto">Join as Vendor</Button>
                      <Button size="sm" variant="outline" onClick={() => handleJoin(c.id, 'delivery')} disabled={!user} className="w-full sm:w-auto">Join as Rider</Button>
                      <Button size="sm" variant="ghost" asChild className="w-full sm:w-auto">
                        <Link to={`/communities/${c.id}`}>View details</Link>
                      </Button>
                      {!user && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/auth">Sign in</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
