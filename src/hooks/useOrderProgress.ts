import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OrderEvent = {
  id: string;
  order_id: string;
  event: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  created_by: string | null;
};

export function useOrderProgress(orderId: string | null) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_progress_events")
        .select("id, order_id, event, description, metadata, created_at, created_by")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setEvents((data as OrderEvent[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const addEvent = useCallback(
    async (evt: { event: string; description?: string | null; metadata?: Record<string, any> }) => {
      if (!orderId) return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast("Please sign in to perform this action.");
        return;
      }
      const { error } = await supabase.from("order_progress_events").insert({
        order_id: orderId,
        event: evt.event,
        description: evt.description ?? null,
        metadata: evt.metadata ?? {},
        created_by: session.session.user.id,
      });
      if (error) {
        console.error(error);
        toast("Failed to add event", { description: error.message });
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-events-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_progress_events", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const newEvt = payload.new as OrderEvent;
          setEvents((prev) => [...prev, newEvt]);
          toast("Order update", { description: newEvt.description || newEvt.event });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { events, loading, refetch: fetchEvents, addEvent };
}
