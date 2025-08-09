import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Report { id: string; target_type: string; target_id: string; reason: string; status: string }

const ContentReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setSEO("Super Admin — Content Reports", "Review and resolve content reports.");
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("content_reports").select("id, target_type, target_id, reason, status").order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load", description: error.message });
    else setReports((data as any) || []);
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("content_reports").update({ status }).eq("id", id);
    if (error) return toast({ title: "Failed to update", description: error.message });
    await load();
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Content Reports</h1>
      <div className="rounded-lg border bg-card p-4">
        <ul className="space-y-2 text-sm">
          {reports.map(r => (
            <li key={r.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.target_type}: {r.target_id}</div>
                  <div className="text-muted-foreground">Reason: {r.reason} — Status: {r.status}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setStatus(r.id, "resolved")}>Resolve</Button>
                  <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "dismissed")}>Dismiss</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ContentReports;
