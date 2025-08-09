import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseIsRiderResult {
  isRider: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Detects whether the current authenticated user has joined any community as a rider (member_type = 'delivery')
// - Uses RLS-safe query against community_members
// - Returns { isRider, loading, refresh }
export default function useIsRider(): UseIsRiderResult {
  const [isRider, setIsRider] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setIsRider(false);
        return;
      }
      const { data, error } = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("member_type", "delivery");
      if (error) throw error;
      // If count is available, it means at least one membership exists
      setIsRider((data as any) !== null); // head:true returns null data; rely on status via count, but not exposed here
      // Fallback: run a non-head query if needed
      if ((data as any) === null) {
        const { data: rows, error: err2 } = await supabase
          .from("community_members")
          .select("id")
          .eq("user_id", userId)
          .eq("member_type", "delivery")
          .limit(1);
        if (err2) throw err2;
        setIsRider(!!rows && rows.length > 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { isRider, loading, refresh: check };
}
