import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useVendorFollow(vendorId?: string) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!vendorId) return;
      try {
        const [{ data: sess }, { data: countRes, error: countErr }] = await Promise.all([
          (supabase as any).auth.getSession(),
          (supabase as any).rpc("get_vendor_follower_count", { vendor_id_param: vendorId }),
        ]);
        if (countErr) throw countErr;
        if (mounted) setFollowersCount(Number(countRes || 0));

        const userId = sess.session?.user?.id;
        if (!userId) {
          if (mounted) setIsFollowing(false);
          return;
        }
        const { data: rels, error } = await (supabase as any)
          .from("vendor_follows")
          .select("vendor_id")
          .eq("vendor_id", vendorId)
          .eq("user_id", userId)
          .limit(1);
        if (error) throw error;
        if (mounted) setIsFollowing(!!(rels && rels.length));
      } catch {}
    })();
    return () => { mounted = false; };
  }, [vendorId]);

  const refreshCount = useCallback(async () => {
    if (!vendorId) return 0;
    try {
      const { data, error } = await (supabase as any).rpc("get_vendor_follower_count", { vendor_id_param: vendorId });
      if (error) throw error;
      const n = Number(data || 0);
      setFollowersCount(n);
      return n;
    } catch {
      return followersCount;
    }
  }, [vendorId, followersCount]);

  const follow = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const { data: sess } = await (supabase as any).auth.getSession();
      if (!sess.session) {
        toast("Sign in required", { description: "Please log in to follow vendors." });
        return;
      }
      const userId = sess.session.user.id;
      const { error } = await (supabase as any)
        .from("vendor_follows")
        .insert({ vendor_id: vendorId, user_id: userId });
      if (error) throw error;
      setIsFollowing(true);
      await refreshCount();
      toast.success("Followed vendor");
    } catch (e: any) {
      // ignore duplicate follows
      if (!String(e?.message || "").toLowerCase().includes("duplicate")) {
        toast("Unable to follow", { description: e?.message || String(e) });
      }
    } finally {
      setLoading(false);
    }
  }, [vendorId, refreshCount]);

  const unfollow = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const { data: sess } = await (supabase as any).auth.getSession();
      if (!sess.session) return;
      const userId = sess.session.user.id;
      const { error } = await (supabase as any)
        .from("vendor_follows")
        .delete()
        .eq("vendor_id", vendorId)
        .eq("user_id", userId);
      if (error) throw error;
      setIsFollowing(false);
      await refreshCount();
      toast.success("Unfollowed vendor");
    } catch (e: any) {
      toast("Unable to unfollow", { description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }, [vendorId, refreshCount]);

  const toggle = useCallback(async () => {
    if (isFollowing) return unfollow();
    return follow();
  }, [isFollowing, follow, unfollow]);

  return { loading, isFollowing, followersCount, follow, unfollow, toggle, refreshCount } as const;
}
