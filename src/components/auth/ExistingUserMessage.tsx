import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Users, ShoppingBag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import useUserRoles from "@/hooks/useUserRoles";
import useIsVendor from "@/hooks/useIsVendor";
import useIsRider from "@/hooks/useIsRider";

interface ExistingUserMessageProps {
  userName: string;
}

const ExistingUserMessage = ({ userName }: ExistingUserMessageProps) => {
  const { roles } = useUserRoles();
  const { isVendor } = useIsVendor();
  const { isRider } = useIsRider();

  // Get unique communities user is part of
  const communities = roles.reduce((acc, role) => {
    const existing = acc.find(c => c.id === role.community_id);
    if (existing) {
      existing.roles.push(role.member_type);
    } else {
      acc.push({
        id: role.community_id,
        name: role.community.name,
        roles: [role.member_type]
      });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; roles: string[] }>);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'vendor': return <ShoppingBag className="h-4 w-4" />;
      case 'delivery': return <Truck className="h-4 w-4" />;
      case 'buyer': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getDashboardLink = () => {
    if (isVendor) return '/vendor/dashboard';
    if (isRider) return '/rider/dashboard';
    return '/catalog';
  };

  if (roles.length === 0) {
    return null; // Let the normal onboarding flow proceed
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <CardTitle className="text-xl">Welcome back, {userName}!</CardTitle>
          </div>
          <CardDescription>
            You're already set up in {communities.length} {communities.length === 1 ? 'community' : 'communities'}. 
            You can continue to your dashboard or join additional communities below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current memberships */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Your Current Memberships:</h4>
            {communities.map((community) => (
              <div key={community.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h5 className="font-medium">{community.name}</h5>
                  <div className="flex gap-2 mt-1">
                    {community.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {getRoleIcon(role)}
                        <span className="ml-1 capitalize">{role}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button asChild className="flex-1">
              <Link to={getDashboardLink()}>
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/catalog">Browse Marketplace</Link>
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground mb-2">
              Want to join another community or add more roles?
            </p>
            <p className="text-xs text-muted-foreground">
              Continue below to explore more communities
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExistingUserMessage;