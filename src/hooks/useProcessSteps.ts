import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProcessStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export const useProcessSteps = () => {
  return useQuery({
    queryKey: ["process-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_steps")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching process steps:", error);
        throw error;
      }

      return data as ProcessStep[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};