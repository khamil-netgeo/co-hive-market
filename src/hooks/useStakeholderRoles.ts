import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StakeholderRole {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useStakeholderRoles = () => {
  return useQuery({
    queryKey: ['stakeholder-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stakeholder_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data as StakeholderRole[];
    },
  });
};