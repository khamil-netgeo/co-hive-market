import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { setSEOAdvanced } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Community { id: string; name: string; description: string | null; member_discount_percent: number; coop_fee_percent: number; community_fee_percent: number }

type MemberType = 'buyer' | 'vendor' | 'delivery' | 'manager';

type MemberRow = { id: string; user_id: string; member_type: MemberType };

export default function CommunityManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperadmin } = useAuthRoles();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<MemberRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [counts, setCounts] = useState<Record<MemberType, number>>({ buyer: 0, vendor: 0, delivery: 0, manager: 0 });

  // Local settings state
  const [memberDiscount, setMemberDiscount] = useState<number>(10);
  const [coopFee, setCoopFee] = useState<number>(2);
  const [communityFee, setCommunityFee] = useState<number>(3);
  const [fundTotal, setFundTotal] = useState<number>(0);
  const [membershipTotal, setMembershipTotal] = useState<number>(0);
  const [recentTxns, setRecentTxns] = useState<{ id: string; amount_cents: number; created_at: string; user_id: string | null; type: string }[]>([]);

  const canManage = useMemo(() => {
    return !!(isAdmin || isSuperadmin || membership?.member_type === 'manager');
  }, [isAdmin, isSuperadmin, membership?.member_type]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: c, error: cErr } = await supabase
          .from("communities")
          .select("id,name,description,member_discount_percent,coop_fee_percent,community_fee_percent")
          .eq("id", id)
          .maybeSingle();
        if (cErr) throw cErr;
        setCommunity(c as any);
        if (c) {
          setMemberDiscount((c as any).member_discount_percent);
          setCoopFee((c as any).coop_fee_percent);
          setCommunityFee((c as any).community_fee_percent);
        }

        // Membership for current user
        if (user) {
          const { data: mem } = await supabase
            .from("community_members")
            .select("id,user_id,member_type")
            .eq("community_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          setMembership(mem as any);
        } else {
          setMembership(null);
        }

        // Load first 20 members
        const { data: mems } = await supabase
          .from("community_members")
          .select("id,user_id,member_type")
          .eq("community_id", id)
          .order("created_at", { ascending: false })
          .limit(20);
        setMembers((mems as any[]) || []);

        // Counts by type (cheap head counts)
        const types: MemberType[] = ['buyer', 'vendor', 'delivery', 'manager'];
        const results = await Promise.all(
          types.map(async (t) => {
            const { count } = await supabase
              .from("community_members")
              .select("id", { count: "exact", head: true })
              .eq("community_id", id)
              .eq("member_type", t);
            return [t, count || 0] as const;
          })
        );
        const nextCounts: Record<MemberType, number> = { buyer: 0, vendor: 0, delivery: 0, manager: 0 };
        results.forEach(([t, c]) => { nextCounts[t] = c; });
        setCounts(nextCounts);

        // Fund transactions and membership payments
        const { data: fundRows, error: fErr } = await (supabase as any)
          .from("community_fund_txns")
          .select("id, amount_cents, created_at, type, user_id")
          .eq("community_id", id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (fErr) throw fErr;
        const contributions = ((fundRows as any[]) || []).filter((r) => r.type === 'contribution');
        setFundTotal(contributions.reduce((sum, r) => sum + (r.amount_cents || 0), 0));
        setRecentTxns(contributions.slice(0, 10) as any);

        const { data: mPays, error: mpErr } = await (supabase as any)
          .from("community_membership_payments")
          .select("amount_cents")
          .eq("community_id", id);
        if (mpErr) throw mpErr;
        setMembershipTotal(((mPays as any[]) || []).reduce((sum, r) => sum + (r.amount_cents || 0), 0));
      } catch (e: any) {
        toast("Unable to load community", { description: e?.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  useEffect(() => {
    if (!community) return;
    setSEOAdvanced({
      title: `Manage ${community.name} — Community`,
      description: community.description || `Manage ${community.name} settings and members`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: community.name,
        description: community.description || undefined,
      },
      url: `${window.location.origin}/communities/${community.id}/manage`,
    });
  }, [community]);

  const handleSave = async () => {
    if (!id || !(isAdmin || isSuperadmin)) {
      toast("Only admins can update settings");
      return;
    }
    try {
      const { error } = await supabase
        .from("communities")
        .update({
          member_discount_percent: memberDiscount,
          coop_fee_percent: coopFee,
          community_fee_percent: communityFee,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Settings saved");
    } catch (e: any) {
      toast("Save failed", { description: e?.message || String(e) });
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

  if (!canManage) {
    return (
      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You need to be a manager or admin to manage this community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link to={`/communities/${id}`}>Back to community</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage {community.name}</h1>
          <p className="text-sm text-muted-foreground">Settings, members, and insights</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to={`/communities/${id}`}>View public page</Link></Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Discounts and fees</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="md">Member Discount %</Label>
              <Input id="md" type="number" min={0} max={100} value={memberDiscount} onChange={(e) => setMemberDiscount(Number(e.target.value))} disabled={!(isAdmin || isSuperadmin)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf">Coop Fee %</Label>
              <Input id="cf" type="number" min={0} max={100} value={coopFee} onChange={(e) => setCoopFee(Number(e.target.value))} disabled={!(isAdmin || isSuperadmin)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cmf">Community Fee %</Label>
              <Input id="cmf" type="number" min={0} max={100} value={communityFee} onChange={(e) => setCommunityFee(Number(e.target.value))} disabled={!(isAdmin || isSuperadmin)} />
            </div>
            <div className="md:col-span-3">
              <Button onClick={handleSave} disabled={!(isAdmin || isSuperadmin)}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Membership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Buyers: {counts.buyer}</Badge>
              <Badge variant="outline">Vendors: {counts.vendor}</Badge>
              <Badge variant="outline">Riders: {counts.delivery}</Badge>
              <Badge variant="outline">Managers: {counts.manager}</Badge>
            </div>
            <div className="grid gap-3">
              <div className="text-sm text-muted-foreground">Totals (lifetime)</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Contributions: RM {(fundTotal/100).toFixed(2)}</Badge>
                <Badge variant="secondary">Memberships: RM {(membershipTotal/100).toFixed(2)}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Recent contributions</div>
                {recentTxns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No contributions yet.</p>
                ) : (
                  <div className="space-y-1">
                    {recentTxns.slice(0,5).map((t) => (
                      <div key={t.id} className="flex justify-between text-xs border rounded p-2">
                        <span className="font-mono">{new Date(t.created_at).toLocaleString()}</span>
                        <span>RM {(t.amount_cents/100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Latest 20 members</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span className="font-mono text-xs">{m.user_id}</span>
                    <Badge variant="secondary">{m.member_type}</Badge>
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
