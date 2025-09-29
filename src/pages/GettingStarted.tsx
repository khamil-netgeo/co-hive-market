import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, ShoppingBag, Truck, UserPlus, Clock, AlertCircle, Loader2 } from "lucide-react";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { useProductionLogging } from "@/hooks/useProductionLogging";
import useUserRoles from "@/hooks/useUserRoles";
import UserRolesDisplay from "@/components/community/UserRolesDisplay";
import MultiRoleOnboardingFlow from "@/components/onboarding/MultiRoleOnboardingFlow";
import SimpleRoleSelector from "@/components/onboarding/SimpleRoleSelector";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import OnboardingResumeCard from "@/components/onboarding/OnboardingResumeCard";
import OnboardingAnalyticsProvider from "@/components/onboarding/OnboardingAnalyticsProvider";
import ExistingUserMessage from "@/components/auth/ExistingUserMessage";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";

const GettingStarted = () => {
  const { user, loading, signOut } = useAuthRoles();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [joiningRole, setJoiningRole] = useState<{ communityId: string; role: string } | null>(null);
  const [showMultiRoleFlow, setShowMultiRoleFlow] = useState<{ [key: string]: boolean }>({});
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [autoProcessingTimeout, setAutoProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [useWizardMode, setUseWizardMode] = useState(true); // New wizard mode state
  const { info, error: logError } = useProductionLogging();
  const { getRolesForCommunity, refresh: refreshRoles } = useUserRoles();
  const { retry, reset, isRetrying, retryCount } = useErrorRecovery();
  const { hasProgress, canResume, initializeProgress, clearProgress } = useOnboardingProgress();
  // Simplified recommendations for demo - just show first 2 communities
  const recommendations = communities.slice(0, 2).map(community => ({
    community,
    score: 85,
    reasons: [`${community.member_discount_percent}% member discount`, 'Growing community', 'Active listings']
  }));

  // Require authentication first and check if user already has roles
  useEffect(() => {
    if (!loading && !user) {
      // Store intended destination for post-auth redirect
      const communityId = searchParams.get('community');
      const role = searchParams.get('role');
      if (communityId && role) {
        localStorage.setItem('postAuthRedirect', `/getting-started?community=${communityId}&role=${role}`);
      }
      navigate("/auth");
      return;
    }
    
    info("GettingStarted: Authentication state", 'auth', { user: user?.id, loading, loadingCommunities });
    setSEO(
      "Get Started — CoopMarket",
      "Join a community marketplace and start buying, selling, or delivering products and services."
    );
    
    if (user && !loading) {
      fetchCommunities();
    }
  }, [user, loading, navigate, searchParams]);

  // Clear stored redirect after successful auth
  useEffect(() => {
    if (user) {
      localStorage.removeItem('postAuthRedirect');
    }
  }, [user]);

  // Auto-process role joining from URL parameters with timeout protection
  useEffect(() => {
    const communityId = searchParams.get('community');
    const role = searchParams.get('role');
    
    if (communityId && role && user && !loading && !autoProcessing && !joiningRole) {
      const validRoles = ['buyer', 'vendor', 'delivery'];
      if (validRoles.includes(role)) {
        // Check if user already has this role before proceeding
        const hasRole = getRolesForCommunity(communityId).includes(role);
        
        if (hasRole) {
          // User already has this role, redirect directly
          redirectToRoleDashboard(role);
          return;
        }
        
        setAutoProcessing(true);
        setLastError(null);
        
        // Set timeout to prevent stuck state
        const timeout = setTimeout(() => {
          setAutoProcessing(false);
          setLastError("Auto-processing timed out. Please try joining manually.");
          toast.error("Auto-processing timed out. Please try joining manually.");
        }, 30000); // 30 second timeout
        
        setAutoProcessingTimeout(timeout);
        handleJoinCommunity(communityId, role as 'buyer' | 'vendor' | 'delivery');
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoProcessingTimeout) {
        clearTimeout(autoProcessingTimeout);
      }
    };
  }, [user, loading, searchParams, autoProcessing, joiningRole, getRolesForCommunity]);

  const redirectToRoleDashboard = (role: string) => {
    if (role === 'vendor') {
      navigate('/vendor/dashboard');
    } else if (role === 'delivery') {
      navigate('/rider');
    } else {
      navigate('/');
    }
  };

  const clearAutoProcessing = () => {
    setAutoProcessing(false);
    if (autoProcessingTimeout) {
      clearTimeout(autoProcessingTimeout);
      setAutoProcessingTimeout(null);
    }
    // Clear URL params to prevent re-triggering
    setSearchParams({});
  };

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
      setLastError("Failed to load communities");
      toast.error("Failed to load communities");
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleRetryFetchCommunities = async () => {
    setLoadingCommunities(true);
    setLastError(null);
    try {
      await retry(fetchCommunities, { maxRetries: 3, retryDelay: 2000 });
    } catch (error) {
      setLastError("Unable to load communities after multiple attempts");
      toast.error("Unable to load communities. Please refresh the page.");
    }
  };

  const handleJoinCommunity = async (communityId: string, memberType: 'buyer' | 'vendor' | 'delivery') => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setJoiningRole({ communityId, role: memberType });
    setLastError(null);

    try {
      // Use retry mechanism for better reliability
      await retry(async () => {
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
          redirectToRoleDashboard(memberType);
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
        toast.success(`Successfully joined as ${memberType}! Welcome to the community!`);
        
        // Refresh user roles to update the UI
        await refreshRoles();
        
        // Redirect based on role type
        redirectToRoleDashboard(memberType);
      }, { maxRetries: 3, retryDelay: 1500 });

    } catch (error: any) {
      logError("Error joining community", 'community', error);
      
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.toLowerCase().includes("duplicate")) {
        toast.info(`You already have the ${memberType} role in this community`);
        redirectToRoleDashboard(memberType);
      } else if (error.code === 'PGRST116') {
        setLastError("Permission denied. Please try signing out and back in.");
        toast.error("Permission denied. Please try signing out and back in.", {
          action: {
            label: "Sign Out",
            onClick: signOut
          }
        });
      } else if (errorMessage.toLowerCase().includes("network")) {
        setLastError("Network error. Please check your connection and try again.");
        toast.error("Network error. Please check your connection and try again.");
      } else {
        setLastError(`Failed to join as ${memberType}. Please try again.`);
        toast.error(`Failed to join as ${memberType}. Please try again.`);
      }
    } finally {
      setJoiningRole(null);
      clearAutoProcessing();
    }
  };

  const handleMultiRoleSelect = async (communityId: string, selectedRoles: ('buyer' | 'vendor' | 'delivery')[]) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setJoiningRole({ communityId, role: 'multiple' });

    try {
      // Insert all selected roles
      const memberInserts = selectedRoles.map(memberType => ({
        community_id: communityId,
        user_id: user.id,
        member_type: memberType as 'buyer' | 'vendor' | 'delivery'
      }));

      const { error: memberError } = await supabase
        .from("community_members")
        .insert(memberInserts);
      if (memberError) throw memberError;

      // If joining as vendor, create vendor profile
      if (selectedRoles.includes('vendor')) {
        const { error: vendorError } = await supabase
          .from("vendors")
          .insert({
            user_id: user.id,
            community_id: communityId,
            display_name: user.email?.split('@')[0] || 'Vendor'
          });
        if (vendorError) throw vendorError;
      }

      logAudit('community.multi_join', 'community', communityId, { roles: selectedRoles });
      toast.success(`Successfully joined as ${selectedRoles.length} roles!`);
      
      // Refresh user roles to update the UI
      await refreshRoles();
      
      // Hide multi-role flow
      setShowMultiRoleFlow(prev => ({ ...prev, [communityId]: false }));
      
      // Redirect based on primary role (vendor > delivery > buyer)
      if (selectedRoles.includes('vendor')) {
        navigate('/vendor/dashboard');
      } else if (selectedRoles.includes('delivery')) {
        navigate('/rider');
      } else {
        navigate('/');
      }
      
    } catch (error: any) {
      logError("Error joining community with multiple roles", 'community', error);
      if (typeof error.message === 'string' && error.message.toLowerCase().includes("duplicate")) {
        toast.error("You already have some of these roles in this community");
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
        {autoProcessing ? (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h1 className="text-4xl font-bold text-gradient-brand">
                Setting Up Your Account...
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're setting up your profile and preparing your dashboard. This usually takes just a few seconds.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated time: 30 seconds</span>
            </div>
            {lastError && (
              <Card className="max-w-md mx-auto border-destructive/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Setup Error</span>
                  </div>
                  <p className="text-sm mb-4">{lastError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAutoProcessing}
                    className="w-full"
                  >
                    Continue Manually
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : !user ? (
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Welcome to CoopMarket
                </CardTitle>
                <CardDescription>
                  Create an account to join a community marketplace and start participating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full mb-3">
                  <Link to="/auth">Create Account or Sign In</Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Join thousands of members buying, selling, and delivering in their communities
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <OnboardingAnalyticsProvider>
            {/* Show existing user message if they already have roles */}
            <ExistingUserMessage userName={user.email?.split('@')[0] || 'User'} />

            {/* Show resume card if user has progress */}
            {canResume && useWizardMode && (
              <div className="mb-8">
                <OnboardingResumeCard
                  onResume={() => {
                    // Resume wizard mode - progress will be restored automatically
                  }}
                  onRestart={() => {
                    clearProgress();
                    initializeProgress('wizard');
                  }}
                />
              </div>
            )}

            {/* Toggle between wizard and classic mode */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={useWizardMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setUseWizardMode(true);
                    if (!hasProgress) {
                      initializeProgress('wizard');
                    }
                  }}
                >
                  Guided Setup
                </Button>
                <Button
                  variant={!useWizardMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setUseWizardMode(false);
                    if (!hasProgress) {
                      initializeProgress('classic');
                    }
                  }}
                >
                  Quick Join
                </Button>
              </div>
            </div>

            {useWizardMode ? (
              /* Wizard Mode */
          <OnboardingWizard
            communities={communities}
            onComplete={handleMultiRoleSelect}
            onBack={() => setUseWizardMode(false)}
            loadingCommunities={joiningRole !== null}
          />
            ) : (
              /* Classic Mode */
              <>
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
                  {loadingCommunities || isRetrying ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <p className="text-muted-foreground">
                            {isRetrying ? `Loading communities... (Attempt ${retryCount + 1})` : "Loading communities..."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : lastError && communities.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <div className="flex items-center justify-center gap-2 text-destructive mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <p className="font-medium">Failed to load communities</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{lastError}</p>
                        <Button onClick={handleRetryFetchCommunities} variant="outline" size="sm">
                          Try Again
                        </Button>
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
                            {showMultiRoleFlow[community.id] ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold">Enhanced Setup</h3>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setShowMultiRoleFlow(prev => ({ ...prev, [community.id]: false }))}
                                    disabled={joiningRole?.communityId === community.id}
                                  >
                                    Simple Setup
                                  </Button>
                                </div>
                                <MultiRoleOnboardingFlow 
                                  onRoleSelect={(roles) => handleMultiRoleSelect(community.id, roles)}
                                  selectedCommunity={community.id}
                                />
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold">Quick Join</h3>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowMultiRoleFlow(prev => ({ ...prev, [community.id]: true }))}
                                    disabled={joiningRole?.communityId === community.id}
                                  >
                                    Multi-Role Setup
                                  </Button>
                                </div>
                                <SimpleRoleSelector
                                  onRoleSelect={(role) => handleJoinCommunity(community.id, role)}
                                  onMultiRoleSelect={() => setShowMultiRoleFlow(prev => ({ ...prev, [community.id]: true }))}
                                  existingRoles={getRolesForCommunity(community.id)}
                                  loading={joiningRole?.communityId === community.id}
                                />
                              </div>
                            )}
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
              </>
            )}
          </OnboardingAnalyticsProvider>
        )}
      </div>
    </main>
  );
};

export default GettingStarted;