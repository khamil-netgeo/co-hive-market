import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import StandardDashboardLayout from "@/components/layout/StandardDashboardLayout";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileStats from "@/components/profile/ProfileStats";

interface Membership { community_id: string; member_type: string }
interface Community { id: string; name: string }
interface Vendor { id: string; display_name: string; community_id: string; active: boolean }

export default function Profile() {
  const { user, roles, loading, signOut } = useAuthRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [communitiesById, setCommunitiesById] = useState<Record<string, Community>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  type ProfileRow = {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  
  const [profile, setProfile] = useState<ProfileRow>({
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    postcode: null,
    country: "MY",
    phone: null,
    latitude: null,
    longitude: null,
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSEO("My Profile — CoopMarket", "View your account, roles, memberships, and vendor info.");
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }
      try {
        const [mRes, vRes] = await Promise.all([
          supabase.from("community_members").select("community_id, member_type"),
          supabase.from("vendors").select("id, display_name, community_id, active"),
        ]);
        if (mRes.error) throw mRes.error;
        if (vRes.error) throw vRes.error;
        setMemberships((mRes.data || []) as any);
        setVendors((vRes.data || []) as any);
        const communityIds = Array.from(new Set((mRes.data || []).map((m: any) => m.community_id).concat((vRes.data || []).map((v: any) => v.community_id))));
        if (communityIds.length) {
          const cRes = await supabase.from("communities").select("id,name").in("id", communityIds);
          if (!cRes.error && cRes.data) {
            const map: Record<string, Community> = {};
            cRes.data.forEach((c) => (map[c.id] = c));
            setCommunitiesById(map);
          }
        }
      } finally {
        setLoadingData(false);
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data) {
        const d: any = data as any;
        setProfile({
          address_line1: d.address_line1 ?? null,
          address_line2: d.address_line2 ?? null,
          city: d.city ?? null,
          state: d.state ?? null,
          postcode: d.postcode ?? null,
          country: d.country ?? "MY",
          phone: d.phone ?? null,
          latitude: d.latitude ?? null,
          longitude: d.longitude ?? null,
        });
      }
    };
    load();
  }, [user?.id]);

  const handleSaveAddress = async () => {
    if (!user?.id) return;
    setSaving(true);
    const payload = { id: user.id, ...profile } as any;
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save address", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Address saved", description: "Your address and location were updated." });
    }
  };

  const profileStats = ProfileStats({ userId: user?.id });

  return (
    <StandardDashboardLayout
      title="My Profile"
      subtitle="Manage your account, roles, and preferences across communities"
      stats={profileStats}
    >
      <ProfileTabs
        user={user}
        roles={roles}
        profile={profile}
        setProfile={setProfile}
        handleSaveAddress={handleSaveAddress}
        saving={saving}
        communitiesById={communitiesById}
        vendors={vendors}
        signOut={async () => { 
          await signOut(); 
          navigate("/"); 
        }}
      />
    </StandardDashboardLayout>
  );
}