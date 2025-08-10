import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCommunity } from "@/context/CommunityContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Feed from "@/pages/Feed";

// Community-scoped feed wrapper
// - Reads :id from route
// - Ensures CommunityContext is set so Feed filters accordingly
// - Keeps UI simple: renders existing Feed (full-screen, mobile-first)
export default function CommunityFeed() {
  const { id } = useParams();
  const { selected, setSelected } = useCommunity();

  useEffect(() => {
    let isMounted = true;
    const setContext = async () => {
      if (!id) return;
      // If already selected, skip fetch
      if (selected.id === id) return;
      try {
        const { data, error } = await supabase
          .from("communities")
          .select("id,name")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!isMounted) return;
        setSelected({ id, name: (data as any)?.name ?? null });
      } catch (e: any) {
        toast("Community not found", { description: e?.message || String(e) });
      }
    };
    setContext();
    return () => { isMounted = false; };
  }, [id, selected.id, setSelected]);

  return (
    <main role="main" className="relative">
      {/* Feed handles its own SEO and loading; context change will re-filter */}
      <Feed />
    </main>
  );
}
