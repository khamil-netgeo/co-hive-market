import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setSEOAdvanced } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { useCommunity } from "@/context/CommunityContext";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

interface Community { id: string; name: string; description: string | null; member_discount_percent: number; coop_fee_percent: number; community_fee_percent: number }

type MemberType = 'buyer' | 'vendor' | 'delivery';

export default function CommunityDetail() {
  const { id } = useParams();
  const { user } = useAuthRoles();
  const navigate = useNavigate();
  const { selected, setSelected } = useCommunity();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<{ id: string; member_type: MemberType } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("communities")
          .select("id,name,description,member_discount_percent,coop_fee_percent,community_fee_percent")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        setCommunity(data as any);

        if (user) {
          const { data: mem } = await supabase
            .from("community_members")
            .select("id, member_type")
            .eq("community_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          setMembership(mem as any);
        } else {
          setMembership(null);
        }
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  useEffect(() => {
    if (!community) return;
    setSEOAdvanced({
      title: `${community.name} — Community | CoopMarket`,
      description: community.description || `${community.name} community on CoopMarket`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: community.name,
        description: community.description || undefined
      },
    });
  }, [community]);

  const isActive = useMemo(() => selected.id === id, [selected.id, id]);

  const handleSetActive = () => {
    if (!community || !id) return;
    setSelected({ id, name: community.name });
    toast.success(`Active community set to ${community.name}`);
  };

  const handleJoin = async (memberType: MemberType) => {
    if (!user || !id) {
      navigate("/auth");
      return;
    }
    try {
      if (membership) {
        if (membership.member_type === memberType) {
          toast.info(`Already a member as ${memberType}`);
        } else {
          const { error: updateErr } = await supabase
            .from("community_members")
            .update({ member_type: memberType })
            .eq("id", membership.id);
          if (updateErr) throw updateErr;
          setMembership({ ...membership, member_type: memberType });
          toast.success(`Updated your role to ${memberType}`);
        }
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("community_members")
          .insert({ community_id: id, user_id: user.id, member_type: memberType })
          .select("id, member_type")
          .maybeSingle();
        if (insErr) throw insErr;
        setMembership(inserted as any);
        toast.success(`Joined as ${memberType}`);
      }

      if (memberType === 'vendor') {
        const { data: vendor, error: vSelErr } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .eq("community_id", id)
          .maybeSingle();
        if (vSelErr) throw vSelErr;
        if (!vendor) {
          const { error: vInsErr } = await supabase
            .from("vendors")
            .insert({ user_id: user.id, community_id: id, display_name: user.email?.split('@')[0] || 'Vendor' });
          if (vInsErr) throw vInsErr;
        }
      }

      logAudit('community.join', 'community', id, { memberType });
    } catch (e: any) {
      toast("Unable to join", { description: e?.message || String(e) });
    }
  };

  const handleLeave = async () => {
    if (!membership) return;
    try {
      const { error } = await supabase.from("community_members").delete().eq("id", membership.id);
      if (error) throw error;
      setMembership(null);
      toast.success("Left community");
      logAudit('community.leave', 'community', id || null);
    } catch (e: any) {
      toast("Unable to leave", { description: e?.message || String(e) });
    }
  };

  if (loading) {
    return (
      <main className="container py-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!community) {
    return (
      <main className="container py-8">
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Community not found.</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{community.name}</h1>
        {community.description && (
          <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About this community</CardTitle>
            <CardDescription>Member benefits and fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Member discount: {community.member_discount_percent}%</Badge>
              <Badge variant="outline">Coop fee: {community.coop_fee_percent}%</Badge>
              <Badge variant="outline">Community fee: {community.community_fee_percent}%</Badge>
            </div>
            <div className="flex gap-2">
              {!membership ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleJoin('buyer')}>Join as Buyer</Button>
                  <Button size="sm" onClick={() => handleJoin('vendor')}>Join as Vendor</Button>
                  <Button size="sm" variant="outline" onClick={() => handleJoin('delivery')}>Join as Rider</Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary">You are a {membership.member_type}</Badge>
                  <Button size="sm" variant="outline" onClick={handleLeave}>Leave</Button>
                </>
              )}
              <Button size="sm" variant={isActive ? "secondary" : "default"} onClick={handleSetActive}>
                {isActive ? 'Active' : 'Set active'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore</CardTitle>
            <CardDescription>Shop and activity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline"><Link to="/products">Browse Catalog</Link></Button>
            <Button asChild variant="outline"><Link to="/feed">Community Feed</Link></Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
