import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ChatThread } from "@/hooks/useChatThreads";

interface UnreadState {
  counts: Record<string, number>;
  loading: boolean;
}

export default function useUnreadCounts(threads: ChatThread[], activeId: string | null) {
  const [state, setState] = useState<UnreadState>({ counts: {}, loading: true });
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null));
  }, []);

  const compute = useCallback(async () => {
    if (!me) return;
    const ids = threads.map((t) => t.id);
    if (ids.length === 0) {
      setState({ counts: {}, loading: false });
      return;
    }

    // Load my read states for all threads
    const { data: reads } = await supabase
      .from("chat_read_states")
      .select("thread_id,last_read_at")
      .in("thread_id", ids)
      .eq("user_id", me);

    const lastReadMap = new Map<string, string>();
    reads?.forEach((r) => lastReadMap.set(r.thread_id, r.last_read_at));

    // For each thread, count messages newer than my last_read_at
    const countsEntries = await Promise.all(
      ids.map(async (id) => {
        const since = lastReadMap.get(id) || "1970-01-01T00:00:00Z";
        const { count } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", id)
          .gt("created_at", since);
        return [id, (count || 0)] as const;
      })
    );

    setState({ counts: Object.fromEntries(countsEntries), loading: false });
  }, [threads, me]);

  useEffect(() => { compute(); }, [compute]);

  // Realtime: increment counts on new messages (if not active)
  useEffect(() => {
    const channel = supabase
      .channel("chat-unread-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const id = (payload.new as any).thread_id as string;
          setState((prev) => {
            if (id === activeId) return prev; // active thread will be marked read separately
            return {
              ...prev,
              counts: { ...prev.counts, [id]: (prev.counts[id] || 0) + 1 },
            };
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  const markThreadRead = useCallback(async (threadId: string | null) => {
    if (!threadId || !me) return;
    const now = new Date().toISOString();
    await supabase
      .from("chat_read_states")
      .upsert({ thread_id: threadId, user_id: me, last_read_at: now }, { onConflict: "thread_id,user_id" });
    setState((prev) => ({ ...prev, counts: { ...prev.counts, [threadId]: 0 } }));
  }, [me]);

  return { counts: state.counts, loading: state.loading, markThreadRead };
}
