import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { setSEOAdvanced } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Community { id: string; name: string; description: string | null }
interface Member { id: string; user_id: string; member_type: string; created_at: string }

export default function CommunityMembers() {
  const { id } = useParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: c } = await supabase
          .from("communities")
          .select("id,name,description")
          .eq("id", id)
          .maybeSingle();
        setCommunity(c as any);

        const { data: mems, error } = await (supabase as any)
          .from("community_members")
          .select("id,user_id,member_type,created_at")
          .eq("community_id", id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        setMembers((mems as any[]) || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!community) return;
    setSEOAdvanced({
      title: `${community.name} Members — Community`,
      description: community.description || `Members of ${community.name}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: community.name,
        description: community.description || undefined,
      },
      url: `${window.location.origin}/communities/${community.id}/members`,
    });
  }, [community]);

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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{community.name} Members</h1>
          <p className="text-sm text-muted-foreground">Directory of members</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to={`/communities/${id}`}>Back</Link></Button>
        </div>
      </header>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Showing latest 100 members</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-mono text-xs break-all">{m.user_id}</div>
                      <div className="text-xs text-muted-foreground">Joined {new Date(m.created_at).toLocaleString()}</div>
                    </div>
                    <Badge variant="secondary">{m.member_type}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
