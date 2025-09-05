import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  rating: number;
  content: string;
  is_featured: boolean;
  display_order: number;
}

export const useTestimonials = (featuredOnly: boolean = false) => {
  return useQuery({
    queryKey: ["testimonials", featuredOnly],
    queryFn: async () => {
      let query = supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (featuredOnly) {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching testimonials:", error);
        throw error;
      }

      return data as Testimonial[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};