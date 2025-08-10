import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function useChatReadState(threadId: string | null) {
  const [me, setMe] = useState<string | null>(null);
  const [myLastRead, setMyLastRead] = useState<string | null>(null);
  const [othersLastRead, setOthersLastRead] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!threadId) return;
    const { data, error } = await supabase
      .from("chat_read_states")
      .select("thread_id,user_id,last_read_at")
      .eq("thread_id", threadId);
    if (error) return;
    if (!data) return;
    const mine = data.find((r) => r.user_id === me);
    const others = data.filter((r) => r.user_id !== me);
    setMyLastRead(mine?.last_read_at ?? null);
    const maxOther = others.reduce<string | null>((acc, r) => {
      if (!acc) return r.last_read_at;
      return acc > r.last_read_at ? acc : r.last_read_at;
    }, null);
    setOthersLastRead(maxOther);
  }, [threadId, me]);

  const markReadNow = useCallback(async () => {
    if (!threadId || !me) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("chat_read_states")
      .upsert({ thread_id: threadId, user_id: me, last_read_at: now }, { onConflict: "thread_id,user_id" });
    if (!error) setMyLastRead(now);
  }, [threadId, me]);

  useEffect(() => { load(); }, [load]);

  return {
    me,
    myLastRead,
    othersLastRead,
    reload: load,
    markReadNow,
    seenByOther: useMemo(() => othersLastRead ?? null, [othersLastRead])
  };
}
