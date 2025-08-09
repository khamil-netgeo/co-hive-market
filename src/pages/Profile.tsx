import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";

interface Membership { community_id: string; member_type: string }
interface Community { id: string; name: string }
interface Vendor { id: string; display_name: string; community_id: string; active: boolean }

export default function Profile() {
  const { user, roles, loading, signOut } = useAuthRoles();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  const userIdShort = useMemo(() => user?.id ? `${user.id.slice(0, 8)}…` : "", [user?.id]);

  return (
    <main className="container py-8">
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
                      <Button size="sm" asChild variant="outline"><Link to="/vendor/plans">Plans</Link></Button>
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
