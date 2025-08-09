import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";

interface Flag { id: string; key: string; description: string | null; enabled: boolean; rollout_percentage: number }

const FeatureFlags = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setSEO("Super Admin — Feature Flags", "Toggle app-wide feature flags and rollouts.");
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("feature_flags").select("id, key, description, enabled, rollout_percentage").order("key");
    if (error) toast({ title: "Failed to load flags", description: error.message });
    else setFlags((data as any) || []);
  };

  const add = async () => {
    const { error } = await supabase
      .from("feature_flags")
      .upsert({ key, description }, { onConflict: "key" });
    if (error) return toast({ title: "Failed to add flag", description: error.message });
    await logAudit("feature_flag.upsert", "feature_flags", key, { description });
    setKey(""); setDescription("");
    await load();
  };

  const toggle = async (flag: Flag) => {
    const { error } = await supabase.from("feature_flags").update({ enabled: !flag.enabled }).eq("id", flag.id);
    if (error) return toast({ title: "Failed to update", description: error.message });
    await logAudit("feature_flag.toggle", "feature_flags", flag.id, { key: flag.key, to: !flag.enabled });
    await load();
  };

  const updateRollout = async (flag: Flag, percent: number) => {
    const pct = Math.max(0, Math.min(100, Math.round(percent)));
    const { error } = await supabase.from("feature_flags").update({ rollout_percentage: pct }).eq("id", flag.id);
    if (error) return toast({ title: "Failed to update", description: error.message });
    await logAudit("feature_flag.update_rollout", "feature_flags", flag.id, { key: flag.key, to: pct });
    await load();
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Feature Flags</h1>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="flag key" value={key} onChange={e => setKey(e.target.value)} />
          <Input placeholder="description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <Button className="mt-2" onClick={add} disabled={!key}>Add Flag</Button>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Flags</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {flags.map(f => (
            <li key={f.id} className="border rounded p-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{f.key}</div>
                {f.description && <p className="text-muted-foreground truncate">{f.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Rollout%</span>
                  <Input
                    type="number"
                    className="w-20"
                    defaultValue={f.rollout_percentage}
                    min={0}
                    max={100}
                    onBlur={(e) => {
                      const v = Number(e.currentTarget.value);
                      if (!Number.isNaN(v) && v !== f.rollout_percentage) updateRollout(f, v);
                    }}
                  />
                </div>
                <Button size="sm" variant={f.enabled ? "secondary" : "default"} onClick={() => toggle(f)}>
                  {f.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FeatureFlags;
