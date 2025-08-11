import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PayoutMethod = "bank_transfer" | "ewallet" | "other";

export interface UserPayoutProfile {
  id?: string;
  user_id: string;
  method: PayoutMethod;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  ewallet_provider?: string | null;
  ewallet_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function usePayoutProfile() {
  const [profile, setProfile] = useState<UserPayoutProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from("user_payout_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile(data as UserPayoutProfile);
      else setProfile({ user_id: userId, method: "bank_transfer" });
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (updates: Partial<UserPayoutProfile>) => {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Not authenticated");

      const payload: UserPayoutProfile = {
        user_id: userId,
        method: updates.method ?? profile?.method ?? "bank_transfer",
        bank_name: updates.bank_name ?? profile?.bank_name ?? null,
        bank_account_name: updates.bank_account_name ?? profile?.bank_account_name ?? null,
        bank_account_number: updates.bank_account_number ?? profile?.bank_account_number ?? null,
        ewallet_provider: updates.ewallet_provider ?? profile?.ewallet_provider ?? null,
        ewallet_id: updates.ewallet_id ?? profile?.ewallet_id ?? null,
        notes: updates.notes ?? profile?.notes ?? null,
      };

      const { data, error } = await supabase
        .from("user_payout_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile(data as UserPayoutProfile);
      return data as UserPayoutProfile;
    } finally {
      setSaving(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  return { profile, loading, saving, reload: load, save };
}

export function formatPayoutDetails(p: UserPayoutProfile | null | undefined) {
  if (!p) return null;
  if (p.method === "bank_transfer") {
    const parts = [
      p.bank_name ? `Bank: ${p.bank_name}` : null,
      p.bank_account_number ? `Acc: ${p.bank_account_number}` : null,
      p.bank_account_name ? `Name: ${p.bank_account_name}` : null,
    ].filter(Boolean);
    return `Bank Transfer — ${parts.join(", ")}`;
  }
  if (p.method === "ewallet") {
    const parts = [
      p.ewallet_provider ? `Provider: ${p.ewallet_provider}` : null,
      p.ewallet_id ? `ID: ${p.ewallet_id}` : null,
    ].filter(Boolean);
    return `E‑Wallet — ${parts.join(", ")}`;
  }
  return p.notes || "Payout details on file";
}
