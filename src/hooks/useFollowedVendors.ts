import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFollowedVendors() {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sess } = await (supabase as any).auth.getSession();
      const userId: string | undefined = sess?.session?.user?.id;
      if (!userId) {
        setIds([]);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("vendor_follows")
        .select("vendor_id")
        .eq("user_id", userId);
      if (error) throw error;
      setIds((data || []).map((r: any) => r.vendor_id));
    } catch {
      setIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ids, loading, refresh: load } as const;
}
