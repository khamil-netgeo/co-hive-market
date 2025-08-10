import { useCallback, useEffect, useMemo, useState } from "react";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface Ticket { id: string; subject: string; status: string; created_at: string; updated_at: string; }
interface Message { id: string; ticket_id: string; sender_user_id: string; body: string; created_at: string; }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [text, setText] = useState("");

  const loadTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, status, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!error) setTickets(data ?? []);
  }, []);

  useEffect(() => { setSEO("Support | CoopMarket", "Create tickets and chat with support."); }, []);
  useEffect(() => { loadTickets(); }, [loadTickets]);

  const createTicket = useCallback(async () => {
    if (!title.trim() || !message.trim()) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ subject: title, status: "open", created_by: userId })
      .select("id")
      .maybeSingle();
    if (!error && data) {
      await supabase.from("support_messages").insert({ ticket_id: data.id, sender_user_id: userId, body: message });
      setTitle("");
      setMessage("");
      setActive(data.id);
      await loadTickets();
    }
  }, [title, message, loadTickets]);

  const [messages, setMessages] = useState<Message[]>([]);
  const loadMessages = useCallback(async (ticketId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("id, ticket_id, sender_user_id, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (!error) setMessages(data ?? []);
  }, []);

  useEffect(() => {
    if (!active) return;
    loadMessages(active);
    const channel = supabase
      .channel(`support-messages-${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${active}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as any as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [active, loadMessages]);

  const send = useCallback(async () => {
    if (!active || !text.trim()) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    await supabase.from("support_messages").insert({ ticket_id: active, sender_user_id: userId, body: text.trim() });
    setText("");
  }, [active, text]);

  return (
    <main>
      <header className="container px-4 py-4 border-b">
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="text-muted-foreground">Open a ticket and chat with our team</p>
        <link rel="canonical" href={`${window.location.origin}/support`} />
      </header>

      <section className="container px-4 py-6 grid gap-6 md:grid-cols-2">
        <article className="border rounded-md p-4">
          <h2 className="font-semibold mb-3">New ticket</h2>
          <div className="space-y-3">
            <Input placeholder="Subject" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea rows={4} placeholder="Describe your issue" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button variant="secondary" onClick={createTicket}>Create</Button>
          </div>
        </article>

        <aside className="border rounded-md p-4">
          <h2 className="font-semibold mb-3">Your tickets</h2>
          <ul className="divide-y">
            {tickets.map((t) => (
              <li key={t.id}>
                <button className="w-full text-left py-3 hover:bg-muted/60 px-2 rounded" onClick={() => setActive(t.id)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.subject}</span>
                    <span className="text-xs text-muted-foreground uppercase">{t.status}</span>
                  </div>
                  <time className="text-xs text-muted-foreground">Updated {new Date(t.updated_at).toLocaleString()}</time>
                </button>
              </li>
            ))}
            {tickets.length === 0 && <li className="py-3 text-sm text-muted-foreground">No tickets yet</li>}
          </ul>
        </aside>
      </section>

      {active && (
        <section className="container px-4 pb-4">
          <article className="border rounded-md flex flex-col h-[60vh]">
            <header className="border-b p-3 font-medium">Conversation</header>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="max-w-[80%] bg-muted rounded-md px-3 py-2 text-sm">
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <time className="block mt-1 text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</time>
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); void send(); }}
              className="border-t p-3 flex gap-2"
            >
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
              <Button type="submit" variant="secondary">Send</Button>
            </form>
          </article>
        </section>
      )}
    </main>
  );
}
