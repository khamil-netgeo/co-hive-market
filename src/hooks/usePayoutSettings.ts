import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PayoutSettings {
  default_min_cents: number;
  min_by_role: {
    vendor: number;
    rider: number;
  };
}

export function usePayoutSettings() {
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "payout_settings")
          .maybeSingle();
        
        if (error) throw error;
        
        if (data?.value) {
          setSettings(data.value as unknown as PayoutSettings);
        } else {
          // Default fallback
          setSettings({
            default_min_cents: 1000,
            min_by_role: { vendor: 1000, rider: 1000 }
          });
        }
      } catch (error) {
        console.error("Failed to fetch payout settings:", error);
        // Use defaults on error
        setSettings({
          default_min_cents: 1000,
          min_by_role: { vendor: 1000, rider: 1000 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const getMinPayoutCents = (role: "vendor" | "rider" = "vendor") => {
    return settings?.min_by_role[role] ?? settings?.default_min_cents ?? 1000;
  };

  return { settings, loading, getMinPayoutCents };
}