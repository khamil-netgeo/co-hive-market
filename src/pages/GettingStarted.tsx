import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, ShoppingBag, Truck, UserPlus } from "lucide-react";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { useProductionLogging } from "@/hooks/useProductionLogging";
import useUserRoles from "@/hooks/useUserRoles";
import UserRolesDisplay from "@/components/community/UserRolesDisplay";

const GettingStarted = () => {
  const { user, loading, signOut } = useAuthRoles();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [joiningRole, setJoiningRole] = useState<{ communityId: string; role: string } | null>(null);
  const { info, error: logError } = useProductionLogging();
  const { getRolesForCommunity, refresh: refreshRoles } = useUserRoles();

  useEffect(() => {
    info("GettingStarted: Authentication state", 'auth', { user: user?.id, loading, loadingCommunities });
    setSEO(
      "Get Started — CoopMarket",
      "Join a community marketplace and start buying, selling, or delivering products and services."
    );
    
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleJoinCommunity = async (communityId: string, memberType: 'buyer' | 'vendor' | 'delivery') => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setJoiningRole({ communityId, role: memberType });

    try {
      // Check if user already has this specific role in this community
      const { data: existingRole, error: existingErr } = await supabase
        .from("community_members")
        .select("id, member_type")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .eq("member_type", memberType)
        .maybeSingle();
      if (existingErr) throw existingErr;

      if (existingRole) {
        toast.info(`You already have the ${memberType} role in this community`);
        return;
      }

      // Insert the new role membership
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: user.id,
          member_type: memberType
        });
      if (memberError) throw memberError;

      // If joining as vendor, create vendor profile
      if (memberType === 'vendor') {
        const { error: vendorError } = await supabase
          .from("vendors")
          .insert({
            user_id: user.id,
            community_id: communityId,
            display_name: user.email?.split('@')[0] || 'Vendor'
          });
        if (vendorError) throw vendorError;
      }

      logAudit('community.join', 'community', communityId, { memberType });
      toast.success(`Successfully added ${memberType} role!`);
      
      // Refresh user roles to update the UI
      await refreshRoles();
      
      navigate(memberType === 'delivery' ? '/rider' : '/');
    } catch (error: any) {
      logError("Error joining community", 'community', error);
      if (typeof error.message === 'string' && error.message.toLowerCase().includes("duplicate")) {
        toast.error("You already have this role in this community");
      } else if (error.code === 'PGRST116') {
        toast.error("Permission denied while joining. Please sign in and try again.");
      } else {
        toast.error("Failed to join community");
      }
    } finally {
      setJoiningRole(null);
    }
  };


  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient-brand mb-4">
              Choose Your Role
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join a community marketplace and start participating as a buyer, vendor, or delivery rider.
            </p>
          </div>

          
          {user && (
            <div className="max-w-xl mx-auto mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">You’re signed in</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button asChild variant="default"><Link to="/">Go to Home</Link></Button>
                  <Button variant="outline" onClick={async () => { await signOut(); }}>Sign out</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {!user && (
            <div className="text-center mb-12">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Account Required
                  </CardTitle>
                  <CardDescription>
                    You need to create an account to join a community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/auth">Create Account</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary">Buyer</Badge>
                </div>
                <CardTitle>Shop & Buy</CardTitle>
                <CardDescription>
                  Browse products and services from local vendors in your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  <li>• Access to community marketplace</li>
                  <li>• Member discounts on purchases</li>
                  <li>• Support local businesses</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-gradient-primary text-primary-foreground">Vendor</Badge>
                </div>
                <CardTitle>Sell & Serve</CardTitle>
                <CardDescription>
                  List your products and services to community members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  <li>• Create product listings</li>
                  <li>• Offer service subscriptions</li>
                  <li>• Connect with local customers</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline">Rider</Badge>
                </div>
                <CardTitle>Deliver & Earn</CardTitle>
                <CardDescription>
                  Provide delivery services for community orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  <li>• Flexible delivery opportunities</li>
                  <li>• Earn from local deliveries</li>
                  <li>• Help your community</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Available Communities</h2>
            {loadingCommunities ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Loading communities...</p>
                </CardContent>
              </Card>
            ) : communities.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No communities available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {communities.map((community) => (
                  <Card key={community.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {community.name}
                        <Badge variant="outline">
                          {community.member_discount_percent}% discount
                        </Badge>
                      </CardTitle>
                      <CardDescription>{community.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <UserRolesDisplay
                        communityId={community.id}
                        existingRoles={getRolesForCommunity(community.id)}
                        onJoinRole={(role) => handleJoinCommunity(community.id, role)}
                        loading={joiningRole?.communityId === community.id}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center gap-2">
                Back to Home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
        </div>
      </div>
    </main>
  );
};

export default GettingStarted;