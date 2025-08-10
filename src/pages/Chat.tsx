import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import useChatThreads from "@/hooks/useChatThreads";
import ChatThreadList from "@/components/chat/ChatThreadList";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  const { threads, loading } = useChatThreads();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setSEO("Messages | CoopMarket", "Chat with vendors and buyers in real-time.");
  }, []);

  useEffect(() => {
    if (!active && threads.length > 0) setActive(threads[0].id);
  }, [threads, active]);

  return (
    <main>
      <header className="container px-4 py-4 border-b">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <link rel="canonical" href={`${window.location.origin}/chat`} />
      </header>
      <section className="container px-0 sm:px-4 py-0 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] border rounded-md overflow-hidden bg-background">
          <ChatThreadList threads={threads} activeId={active} onSelect={setActive} />
          <ChatWindow threadId={active} />
        </div>
      </section>
    </main>
  );
}
