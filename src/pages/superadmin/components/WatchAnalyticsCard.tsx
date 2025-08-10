import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

type EventRow = {
  target_type: "product" | "service";
  target_id: string;
  watched_ms: number;
  session_id: string;
  created_at: string;
};

type NameMap = Record<string, string>; // key: `${type}:${id}` => name

const fmtMinutes = (ms: number) => `${(ms / 60000).toFixed(1)}m`;

export default function WatchAnalyticsCard() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [names, setNames] = useState<NameMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const weekAgoIso = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from("feed_watch_events")
          .select("target_type,target_id,watched_ms,session_id,created_at")
          .gte("created_at", weekAgoIso)
          .order("created_at", { ascending: false })
          .limit(5000);
        if (error) throw error;
        setRows((data as EventRow[]) || []);

        // Build top keys to resolve names
        const sums = new Map<string, number>();
        (data || []).forEach((r: any) => {
          const k = `${r.target_type}:${r.target_id}`;
          sums.set(k, (sums.get(k) || 0) + (r.watched_ms || 0));
        });
        const top = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
        const prodIds = top.filter(([k]) => k.startsWith("product:")).map(([k]) => k.split(":")[1]);
        const svcIds = top.filter(([k]) => k.startsWith("service:")).map(([k]) => k.split(":")[1]);

        const [prodRes, svcRes] = await Promise.all([
          prodIds.length
            ? supabase.from("products").select("id,name").in("id", prodIds)
            : Promise.resolve({ data: [] as any[] }),
          svcIds.length
            ? supabase.from("vendor_services").select("id,name").in("id", svcIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);
        const map: NameMap = {};
        (prodRes.data || []).forEach((p: any) => (map[`product:${p.id}`] = p.name));
        (svcRes.data || []).forEach((s: any) => (map[`service:${s.id}`] = s.name));
        setNames(map);
      } catch (e) {
        // Ignore; card will still show aggregate basics
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { totalMs, totalEvents, uniqueSessions, daily, top } = useMemo(() => {
    const totalMs = rows.reduce((sum, r) => sum + (r.watched_ms || 0), 0);
    const totalEvents = rows.length;
    const uniqueSessions = new Set(rows.map((r) => r.session_id)).size;

    // Build last 7 days buckets
    const days: { label: string; key: string; ms: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), key, ms: 0 });
    }
    const idxByKey = new Map(days.map((d, i) => [d.key, i] as const));
    rows.forEach((r) => {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      const idx = idxByKey.get(key);
      if (idx !== undefined) days[idx].ms += r.watched_ms || 0;
    });

    // Top items by watch time
    const sums = new Map<string, number>();
    rows.forEach((r) => {
      const k = `${r.target_type}:${r.target_id}`;
      sums.set(k, (sums.get(k) || 0) + (r.watched_ms || 0));
    });
    const top = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalMs, totalEvents, uniqueSessions, daily: days, top };
  }, [rows]);

  const maxDaily = Math.max(1, ...daily.map((d) => d.ms));

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Watch Analytics (7d)
          <Badge variant="secondary" className="ml-2">Beta</Badge>
        </CardTitle>
        <CardDescription>Engagement from the vertical shoppable feed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Total Watch Time</div>
            <div className="text-xl font-bold">{fmtMinutes(totalMs)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Events</div>
            <div className="text-xl font-bold">{totalEvents.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sessions</div>
            <div className="text-xl font-bold">{uniqueSessions.toLocaleString()}</div>
          </div>
        </div>

        {/* Daily bars */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Daily watch time</div>
          <div className="grid grid-cols-7 gap-2 items-end h-24">
            {daily.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-xl bg-gradient-primary shadow-elegant"
                  style={{ height: `${Math.max(6, (d.ms / maxDaily) * 100)}%` }}
                  aria-label={`${d.label}: ${fmtMinutes(d.ms)}`}
                />
                <div className="text-[10px] text-muted-foreground">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top items */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Top items by watch time</div>
          <div className="space-y-2">
            {top.length ? top.map(([key, ms]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded-xl hover-scale">
                <div className="truncate max-w-[60%]">
                  <div className="text-sm font-medium truncate">{names[key] || key}</div>
                  <div className="text-xs text-muted-foreground">{key.split(":")[0]}</div>
                </div>
                <div className="text-sm font-semibold">{fmtMinutes(ms)}</div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No data yet</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
