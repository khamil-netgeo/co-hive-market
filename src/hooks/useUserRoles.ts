import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProductionLogging } from "./useProductionLogging";

interface UserRole {
  id: string;
  community_id: string;
  member_type: 'buyer' | 'vendor' | 'delivery';
  community: {
    name: string;
  };
}

interface UseUserRolesResult {
  roles: UserRole[];
  loading: boolean;
  refresh: () => Promise<void>;
  hasRoleInCommunity: (communityId: string, memberType: 'buyer' | 'vendor' | 'delivery') => boolean;
  getRolesForCommunity: (communityId: string) => string[];
  joinCommunity: (communityId: string, memberType: 'buyer' | 'vendor' | 'delivery') => Promise<void>;
}

export default function useUserRoles(): UseUserRolesResult {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { info, error: logError } = useProductionLogging();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) {
        setRoles([]);
        return;
      }

      const { data, error } = await supabase
        .from("community_members")
        .select(`
          id,
          community_id,
          member_type,
          community:communities(name)
        `)
        .eq("user_id", userId);

      if (error) throw error;
      
      setRoles(data as UserRole[] || []);
      info("User roles loaded successfully", 'auth', { roleCount: data?.length || 0 });
    } catch (error: any) {
      logError("Failed to load user roles", 'auth', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRoleInCommunity = (communityId: string, memberType: 'buyer' | 'vendor' | 'delivery') => {
    return roles.some(role => 
      role.community_id === communityId && role.member_type === memberType
    );
  };

  const getRolesForCommunity = (communityId: string) => {
    return roles
      .filter(role => role.community_id === communityId)
      .map(role => role.member_type);
  };

  const joinCommunity = async (communityId: string, memberType: 'buyer' | 'vendor' | 'delivery') => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('community_members')
        .insert({
          user_id: userId,
          community_id: communityId,
          member_type: memberType
        });

      if (error) throw error;
      
      info(`Successfully joined community as ${memberType}`, 'auth', { communityId, memberType });
      await fetchRoles(); // Refresh roles after joining
    } catch (error: any) {
      logError(`Failed to join community as ${memberType}`, 'auth', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    loading,
    refresh: fetchRoles,
    hasRoleInCommunity,
    getRolesForCommunity,
    joinCommunity
  };
}