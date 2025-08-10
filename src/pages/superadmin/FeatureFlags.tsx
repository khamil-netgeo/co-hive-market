import { useEffect, useMemo, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";

interface Flag {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  audience: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

const FeatureFlags = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [search, setSearch] = useState("");

  // quick add
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAudience, setNewAudience] = useState("");

  useEffect(() => {
    setSEO("Super Admin — Feature Flags", "Toggle app-wide feature flags and rollouts.");
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("id, key, description, enabled, rollout_percentage, audience, updated_at, updated_by")
      .order("key");
    if (error) toast({ title: "Failed to load flags", description: error.message });
    else setFlags((data as any) || []);
  };

  const add = async () => {
    if (!newKey) return;
    const { error } = await supabase
      .from("feature_flags")
      .upsert({ key: newKey, description: newDesc || null, audience: newAudience || null }, { onConflict: "key" });
    if (error) return toast({ title: "Failed to add flag", description: error.message });
    await logAudit("feature_flag.upsert", "feature_flags", newKey, { description: newDesc, audience: newAudience });
    setNewKey(""); setNewDesc(""); setNewAudience("");
    await load();
  };

  const updateFlag = async (flag: Flag, patch: Partial<Flag>) => {
    const { error } = await supabase.from("feature_flags").update(patch).eq("id", flag.id);
    if (error) return toast({ title: "Update failed", description: error.message });
    await logAudit("feature_flag.update", "feature_flags", flag.id, { key: flag.key, patch });
    await load();
  };

  const toggle = async (flag: Flag) => {
    const next = !flag.enabled;
    if (!window.confirm(`${next ? "Enable" : "Disable"} ${flag.key}?`)) return;
    await updateFlag(flag, { enabled: next });
  };

  const updateRollout = async (flag: Flag, percent: number) => {
    const pct = Math.max(0, Math.min(100, Math.round(percent)));
    await updateFlag(flag, { rollout_percentage: pct });
  };

  const remove = async (flag: Flag) => {
    if (!window.confirm(`Delete flag "${flag.key}"?`)) return;
    const { error } = await supabase.from("feature_flags").delete().eq("id", flag.id);
    if (error) return toast({ title: "Delete failed", description: error.message });
    await logAudit("feature_flag.delete", "feature_flags", flag.id, { key: flag.key });
    toast({ title: "Deleted" });
    await load();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return flags;
    return flags.filter((f) =>
      f.key.toLowerCase().includes(q) ||
      (f.description ?? "").toLowerCase().includes(q) ||
      (f.audience ?? "").toLowerCase().includes(q)
    );
  }, [flags, search]);

  return (
    <section>
      <h1 className="sr-only">Super Admin Feature Flags</h1>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Add a new flag</h2>
        <div className="grid gap-2 mt-3 sm:grid-cols-3">
          <Input placeholder="flag key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <Input placeholder="description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <Input placeholder="audience (optional)" value={newAudience} onChange={(e) => setNewAudience(e.target.value)} />
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={add} disabled={!newKey}>Add Flag</Button>
          <Input
            placeholder="Search flags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:ml-auto sm:w-64"
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4 overflow-x-auto">
        <h2 className="text-lg font-medium mb-3">Flags</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead className="min-w-[220px]">Description</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Rollout %</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium break-all">{f.key}</TableCell>
                <TableCell>
                  <Input
                    defaultValue={f.description ?? ""}
                    onBlur={(e) => {
                      const v = e.currentTarget.value;
                      if (v !== (f.description ?? "")) updateFlag(f, { description: v || null });
                    }}
                    placeholder="description"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={f.audience ?? ""}
                    onBlur={(e) => {
                      const v = e.currentTarget.value;
                      if (v !== (f.audience ?? "")) updateFlag(f, { audience: v || null });
                    }}
                    placeholder="audience"
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={f.enabled} onCheckedChange={() => toggle(f)} />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-24"
                    defaultValue={f.rollout_percentage}
                    min={0}
                    max={100}
                    onBlur={(e) => {
                      const v = Number(e.currentTarget.value);
                      if (!Number.isNaN(v) && v !== f.rollout_percentage) updateRollout(f, v);
                    }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => remove(f)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default FeatureFlags;
