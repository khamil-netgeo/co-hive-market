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
      const { data, error } = await supabase
        .from("vendors")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .limit(1);
      if (error) throw error;
      setIsVendor(!!data && data.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return { isVendor, loading, refresh: check };
}
