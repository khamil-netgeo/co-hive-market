import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useChatMessages from "@/hooks/useChatMessages";
import useChatReadState from "@/hooks/useChatReadState";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  threadId: string | null;
}

export default function ChatWindow({ threadId }: Props) {
  const { messages, loading, send } = useChatMessages(threadId);
  const { markReadNow, seenByOther } = useChatReadState(threadId);
  const [text, setText] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [othersTyping, setOthersTyping] = useState(false);
  const [othersOnline, setOthersOnline] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);
  const presenceRef = useRef<any>(null);
  const typingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null));
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    // Mark as read when new messages arrive
    markReadNow();
  }, [messages.length, threadId, markReadNow]);

  // Presence: typing indicator for this thread
  useEffect(() => {
    if (!threadId || !me) return;
    const channel = supabase.channel(`chat-presence-${threadId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state: any = channel.presenceState();
        const entries = Object.entries(state) as any[];
        const typing = entries.some(([key, arr]: any) => key !== me && Array.isArray(arr) && arr.some((p: any) => p?.typing));
        const online = entries.some(([key]: any) => key !== me);
        setOthersTyping(typing);
        setOthersOnline(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: me, typing: false, online_at: new Date().toISOString() });
        }
      });

    presenceRef.current = channel;
    return () => {
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
  }, [threadId, me]);

  // Prefetch signed URLs for attachments
  useEffect(() => {
    const run = async () => {
      const attachments = messages.filter((m) => m.file_url).map((m) => m.file_url!) as string[];
      for (const path of attachments) {
        if (fileUrls[path]) continue;
        const { data, error } = await supabase.storage.from('chat-files').createSignedUrl(path, 60);
        if (!error && data?.signedUrl) {
          setFileUrls((prev) => ({ ...prev, [path]: data.signedUrl }));
        }
      }
    };
    run();
  }, [messages, fileUrls]);

  if (!threadId) {
    return (
      <section className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a conversation to start messaging.
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col h-full">
      <div className="px-4 py-2 border-b text-xs text-muted-foreground">
        {othersOnline ? "Online" : "Offline"}
      </div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {messages.map((m) => {
          const mine = m.sender_user_id === me;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}> 
              <div className={cn(
                "max-w-[80%] rounded-md px-3 py-2 text-sm shadow-sm",
                mine ? "bg-primary/10" : "bg-muted"
              )}>
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.file_url && (
                  m.message_type === 'image' ? (
                    <img src={fileUrls[m.file_url] || ''} alt="Attachment image" loading="lazy" className="mt-2 rounded-md max-w-full" />
                  ) : (
                    <a href={fileUrls[m.file_url] || '#'} target="_blank" rel="noopener" className="mt-2 underline text-primary block">
                      Open file
                    </a>
                  )
                )}
                <time className="block mt-1 text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</time>
              </div>
            </div>
          );
        })}
      </div>
      {othersTyping && (<div className="px-4 pb-2 text-xs text-muted-foreground">Typing…</div>)}

      {/* Composer - mobile friendly sticky footer */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          const { error } = await send(text.trim());
          if (!error) setText("");
        }}
        className="border-t p-3 flex gap-2"
        aria-label="Message composer"
      >
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (presenceRef.current && me) {
              presenceRef.current.track({ user_id: me, typing: true, online_at: new Date().toISOString() });
              if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
              typingTimerRef.current = window.setTimeout(() => {
                presenceRef.current?.track({ user_id: me, typing: false, online_at: new Date().toISOString() });
              }, 1500) as unknown as number;
            }
          }}
          placeholder="Type a message…"
          aria-label="Message"
        />
        <Button type="submit" variant="secondary">Send</Button>
      </form>
    </section>
  );
}
