import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import useChatThreads from "@/hooks/useChatThreads";
import ChatThreadList from "@/components/chat/ChatThreadList";
import ChatWindow from "@/components/chat/ChatWindow";
import { useSearchParams } from "react-router-dom";
import useUnreadCounts from "@/hooks/useUnreadCounts";
export default function ChatPage() {
  const { threads, loading } = useChatThreads();
  const [active, setActive] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [paramsHandled, setParamsHandled] = useState(false);
  const { counts, markThreadRead } = useUnreadCounts(threads, active);
  useEffect(() => {
    setSEO("Messages | CoopMarket", "Chat with vendors and buyers in real-time.");
  }, []);

  // Handle deep-linking via query params: threadId OR (vendorId [+ buyerUserId])
  useEffect(() => {
    if (paramsHandled) return;
    const threadId = searchParams.get("threadId");
    const vendorId = searchParams.get("vendorId");
    const buyerUserId = searchParams.get("buyerUserId");

    const handle = async () => {
      try {
        if (threadId) {
          setActive(threadId);
          setParamsHandled(true);
          return;
        }
        if (vendorId) {
          // Ensure or find thread on-demand
          const { ensureThreadWithVendor, ensureThreadBetween } = await import("@/lib/chat");
          const id = buyerUserId
            ? await ensureThreadBetween(buyerUserId, vendorId)
            : await ensureThreadWithVendor(vendorId);
          if (id) setActive(id);
          setParamsHandled(true);
        }
      } catch {}
    };
    handle();
  }, [searchParams, paramsHandled]);

  // Default: select latest thread if none active
  useEffect(() => {
    if (!active && threads.length > 0) setActive(threads[0].id);
  }, [threads, active]);

  // Mark active thread as read
  useEffect(() => {
    if (active) markThreadRead(active);
  }, [active, markThreadRead]);

  return (
    <main>
      <header className="container px-4 py-4 border-b">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <link rel="canonical" href={`${window.location.origin}/chat`} />
      </header>
      <section className="container px-0 sm:px-4 py-0 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] border rounded-md overflow-hidden bg-background">
          <ChatThreadList threads={threads} activeId={active} onSelect={setActive} counts={counts} />
          <ChatWindow threadId={active} />
        </div>
      </section>
    </main>
  );
}
