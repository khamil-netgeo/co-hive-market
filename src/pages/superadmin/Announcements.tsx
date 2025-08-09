import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Announcement { id: string; title: string; body: string; status: string; publish_at: string | null; expires_at: string | null }

const Announcements = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    setSEO("Super Admin — Announcements", "Publish global announcements.");
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("announcements").select("id, title, body, status, publish_at, expires_at").order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load", description: error.message });
    else setItems((data as any) || []);
  };

  const add = async () => {
    const { error } = await supabase.from("announcements").insert({ title, body, status: "draft" });
    if (error) return toast({ title: "Failed to add", description: error.message });
    setTitle(""); setBody("");
    await load();
  };

  const publish = async (id: string) => {
    const { error } = await supabase.from("announcements").update({ status: "published", publish_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "Failed to publish", description: error.message });
    await load();
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Announcements</h1>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-2">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Body" value={body} onChange={e => setBody(e.target.value)} />
        </div>
        <Button className="mt-2" onClick={add} disabled={!title || !body}>Create Draft</Button>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">All Announcements</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map(a => (
            <li key={a.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title} <span className="text-xs text-muted-foreground">({a.status})</span></div>
                  <p className="text-muted-foreground">{a.body}</p>
                </div>
                {a.status !== 'published' && <Button size="sm" onClick={() => publish(a.id)}>Publish</Button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Announcements;
