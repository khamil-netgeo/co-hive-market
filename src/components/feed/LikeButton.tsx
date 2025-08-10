import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LikeTarget = "product" | "service";

type LikeButtonProps = {
  targetType: LikeTarget;
  targetId: string;
  visible?: boolean;
  className?: string;
};

export default function LikeButton({ targetType, targetId, visible = true, className }: LikeButtonProps) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const key = useMemo(() => `${targetType}:${targetId}`, [targetType, targetId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!visible) return;
      try {
        const [{ data: sum }, { data: { user } = { user: null } }] = await Promise.all([
          supabase
            .from("feed_like_summary")
            .select("like_count")
            .eq("target_type", targetType)
            .eq("target_id", targetId)
            .maybeSingle(),
          supabase.auth.getUser(),
        ]);
        if (!mounted) return;
        setCount((sum as any)?.like_count ?? 0);
        if (user) {
          const { data: row } = await supabase
            .from("feed_likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("target_type", targetType)
            .eq("target_id", targetId)
            .maybeSingle();
          if (!mounted) return;
          setLiked(!!row);
        }
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, [key, visible, targetType, targetId]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { user } = { user: null } } = await supabase.auth.getUser();
      if (!user) {
        toast("Please sign in to like items");
        setLoading(false);
        return;
      }
      if (liked) {
        // Optimistic update
        setLiked(false);
        setCount((c) => (c ?? 0) - 1);
        const { error } = await supabase
          .from("feed_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId);
        if (error) throw error;
      } else {
        setLiked(true);
        setCount((c) => (c ?? 0) + 1);
        const { error } = await supabase
          .from("feed_likes")
          .insert({ user_id: user.id, target_type: targetType, target_id: targetId });
        if (error) throw error;
      }
    } catch (e: any) {
      // Revert on failure
      setLiked((v) => !v);
      setCount((c) => (liked ? (c ?? 1) + 1 : Math.max(0, (c ?? 0) - 1)));
      toast("Could not update like", { description: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        size="icon"
        variant={liked ? "tiktok" : "hero"}
        className="hover-scale"
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        onClick={toggle}
        disabled={loading}
      >
        <Heart className={liked ? "fill-current" : ""} />
      </Button>
      <div className="mt-1 text-center text-xs font-medium select-none">
        {count ?? "–"}
      </div>
    </div>
  );
}
