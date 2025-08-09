import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Setting { id: string; key: string; value: any; description: string }

const GlobalSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setSEO("Super Admin — Global Settings", "Manage global application configuration.");
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("app_settings").select("id, key, value, description").order("key");
    if (error) toast({ title: "Failed to load settings", description: error.message });
    else setSettings((data as any) || []);
  };

  const add = async () => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      const { error } = await supabase.from("app_settings").insert({ key, value: parsed, description });
      if (error) throw error;
      toast({ title: "Setting added" });
      setKey(""); setValue(""); setDescription("");
      await load();
    } catch (e: any) {
      toast({ title: "Invalid JSON", description: e.message });
    }
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Global Settings</h1>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="key" value={key} onChange={e => setKey(e.target.value)} />
          <Input placeholder='{"some":"json"}' value={value} onChange={e => setValue(e.target.value)} />
          <Input placeholder="description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <Button className="mt-2" onClick={add} disabled={!key}>Add / Update</Button>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Settings</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {settings.map(s => (
            <li key={s.id} className="border rounded p-2">
              <div className="font-medium">{s.key}</div>
              <pre className="text-xs whitespace-pre-wrap mt-1">{JSON.stringify(s.value, null, 2)}</pre>
              {s.description && <p className="text-muted-foreground mt-1">{s.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default GlobalSettings;
