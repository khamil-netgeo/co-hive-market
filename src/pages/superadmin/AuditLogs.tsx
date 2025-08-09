import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

interface Log { id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string }

const AuditLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    setSEO("Super Admin — Audit Logs", "View platform audit logs.");
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("audit_logs").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(200);
    setLogs((data as any) || []);
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Audit Logs</h1>
      <div className="rounded-lg border bg-card p-4">
        <ul className="space-y-2 text-sm">
          {logs.map(l => (
            <li key={l.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{l.action}</div>
                  <div className="text-muted-foreground">{l.entity_type} {l.entity_id}</div>
                </div>
                <time className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</time>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default AuditLogs;
