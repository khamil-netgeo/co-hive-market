import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseIsVendorResult {
  isVendor: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Determines whether current user has a vendor profile in any community
export default function useIsVendor(): UseIsVendorResult {
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setIsVendor(false);
        return;
      }
      const { count, error } = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("member_type", "vendor");
      if (error) throw error;
      setIsVendor((count ?? 0) > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return { isVendor, loading, refresh: check };
}
