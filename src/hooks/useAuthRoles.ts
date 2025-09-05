import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useProductionLogging } from './useProductionLogging';

export type AuthRoles = {
  user: User | null;
  roles: string[];
  isAdmin: boolean;
  isSuperadmin: boolean;
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

export default function useAuthRoles(): AuthRoles {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { info } = useProductionLogging();

  const fetchRoles = async (uid?: string | null) => {
    const userId = uid ?? session?.user?.id ?? null;
    if (!userId) {
      setRoles([]);
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!error && data) {
      setRoles(data.map((r) => String(r.role)));
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      // Ensure UI waits for role resolution to avoid redirect flicker
      setLoading(true);
      // Defer Supabase calls to avoid deadlocks
      setTimeout(async () => {
        await fetchRoles(nextSession?.user?.id);
        setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      info("useAuthRoles: Initial session check", 'auth', { session: session?.user?.id || null });
      setSession(session);
      setUser(session?.user ?? null);
      await fetchRoles(session?.user?.id);
      setLoading(false);
      info("useAuthRoles: Loading set to false after roles fetched");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSuperadmin = roles.includes("superadmin");
  const isAdmin = isSuperadmin || roles.includes("admin");

  return {
    user,
    roles,
    isAdmin,
    isSuperadmin,
    loading,
    refreshRoles: () => fetchRoles(),
    signOut,
  };
}
