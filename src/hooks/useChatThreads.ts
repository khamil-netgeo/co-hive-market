import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatThread {
  id: string;
  subject: string | null;
  buyer_user_id: string | null;
  vendor_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  status: string;
}

export default function useChatThreads() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, subject, buyer_user_id, vendor_id, last_message_at, last_message_preview, status")
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setThreads(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("chat-threads-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_threads" },
        (payload) => {
          setThreads((prev) => {
            const idx = prev.findIndex((t) => t.id === (payload.new as any).id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...(next[idx] as any), ...(payload.new as any) } as ChatThread;
            return next.sort((a, b) => (b.last_message_at || "").localeCompare(a.last_message_at || ""));
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_threads" },
        (payload) => {
          setThreads((prev) => [payload.new as any as ChatThread, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { threads, loading, error, reload: load };
}
