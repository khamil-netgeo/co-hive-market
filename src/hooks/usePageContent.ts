import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PageContent {
  id: string;
  page_slug: string;
  content_key: string;
  content_value: string;
  content_type: string;
}

export const usePageContent = (pageSlug: string) => {
  return useQuery({
    queryKey: ["page-content", pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_slug", pageSlug)
        .eq("is_active", true);

      if (error) {
        console.error(`Error fetching page content for ${pageSlug}:`, error);
        throw error;
      }

      // Transform into a key-value object for easier access
      const contentMap: Record<string, string> = {};
      data?.forEach((item: PageContent) => {
        contentMap[item.content_key] = item.content_value;
      });

      return contentMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper hook to get a specific content value
export const useContentValue = (pageSlug: string, contentKey: string, fallback: string = "") => {
  const { data, isLoading } = usePageContent(pageSlug);
  
  return {
    value: data?.[contentKey] || fallback,
    isLoading
  };
};