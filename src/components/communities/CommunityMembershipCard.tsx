import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, Crown, ShoppingCart, Truck, Store } from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  member_discount_percent: number;
}

interface Membership {
  id: string;
  community_id: string;
  member_type: 'buyer' | 'vendor' | 'delivery' | 'manager';
}

interface CommunityMembershipCardProps {
  community: Community;
  memberships: Membership[];
  isActive: boolean;
  onSetActive: () => void;
  onLeave: (membershipId: string) => void;
}

const roleConfig = {
  buyer: { 
    label: "Buyer", 
    icon: ShoppingCart, 
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    variant: "secondary" as const
  },
  vendor: { 
    label: "Vendor", 
    icon: Store, 
    color: "bg-green-500/10 text-green-700 border-green-200",
    variant: "default" as const
  },
  delivery: { 
    label: "Rider", 
    icon: Truck, 
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
    variant: "outline" as const
  },
  manager: { 
    label: "Manager", 
    icon: Crown, 
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    variant: "default" as const
  }
};

export default function CommunityMembershipCard({
  community,
  memberships,
  isActive,
  onSetActive,
  onLeave
}: CommunityMembershipCardProps) {
  const hasManagerRole = memberships.some(m => m.member_type === 'manager');
  const primaryRole = hasManagerRole ? 'manager' : memberships[0]?.member_type;

  return (
    <Card className={`transition-all duration-300 hover:shadow-elegant ${
      isActive ? 'ring-2 ring-primary/20 bg-primary/5' : 'hover:shadow-soft'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                <Link 
                  to={`/communities/${community.id}`} 
                  className="hover:text-primary transition-colors"
                >
                  {community.name}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {community.description || "No description"}
              </p>
            </div>
          </div>
          {isActive && (
            <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Roles Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Your Roles</h4>
            <Badge variant="outline" className="text-xs">
              {community.member_discount_percent}% discount
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {memberships.map((membership) => {
              const config = roleConfig[membership.member_type];
              const Icon = config.icon;
              
              return (
                <div
                  key={membership.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Members</span>
            </div>
            <p className="text-lg font-semibold">-</p>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Joined</div>
            <p className="text-lg font-semibold">Recently</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!isActive && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onSetActive}
              className="flex-1 min-w-[100px]"
            >
              Set Active
            </Button>
          )}
          
          {hasManagerRole && (
            <Button size="sm" asChild className="flex-1 min-w-[100px]">
              <Link to={`/communities/${community.id}/manage`}>
                Manage Community
              </Link>
            </Button>
          )}
          
          {primaryRole && (
            <Button 
              size="sm" 
              variant="secondary" 
              asChild 
              className="flex-1 min-w-[100px]"
            >
              <Link to={`/${primaryRole === 'delivery' ? 'rider' : primaryRole}`}>
                Go to Dashboard
              </Link>
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onLeave(memberships[0].id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Leave
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}