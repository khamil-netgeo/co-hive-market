import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  body: string | null;
  file_url: string | null;
  message_type: string;
  created_at: string;
}

export default function useChatMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, thread_id, sender_user_id, body, file_url, message_type, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      setMessages(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`chat-messages-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as any as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const send = useCallback(async (text: string) => {
    if (!threadId) return { error: new Error("Missing threadId") };
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("chat_messages")
      .insert({ thread_id: threadId, sender_user_id: userId, body: text, message_type: "text" });
    return { error };
  }, [threadId]);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  return { messages, loading, error, reload: load, send, hasMessages };
}
