import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
    const { error } = await supabase.from("feature_flags").insert({ key, description });
    if (error) return toast({ title: "Failed to add flag", description: error.message });
    setKey(""); setDescription("");
    await load();
  };

  const toggle = async (flag: Flag) => {
    const { error } = await supabase.from("feature_flags").update({ enabled: !flag.enabled }).eq("id", flag.id);
    if (error) return toast({ title: "Failed to update", description: error.message });
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
            <li key={f.id} className="border rounded p-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{f.key}</div>
                {f.description && <p className="text-muted-foreground">{f.description}</p>}
              </div>
              <Button size="sm" variant={f.enabled ? "secondary" : "default"} onClick={() => toggle(f)}>
                {f.enabled ? "Disable" : "Enable"}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FeatureFlags;
