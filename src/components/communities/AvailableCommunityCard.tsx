import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, Check, ArrowRight, ShoppingCart, Store, Truck } from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  member_discount_percent: number;
  coop_fee_percent: number;
  community_fee_percent: number;
}

type MemberType = 'buyer' | 'vendor' | 'delivery';

interface ButtonState {
  text: string;
  variant: "default" | "outline" | "secondary";
  icon: boolean;
  disabled: boolean;
}

interface AvailableCommunityCardProps {
  community: Community;
  user: any;
  getButtonState: (communityId: string, memberType: MemberType) => ButtonState;
  onJoin: (communityId: string, memberType: MemberType) => void;
}

const roleConfig = {
  buyer: { 
    icon: ShoppingCart, 
    label: "Buyer",
    color: "text-blue-600"
  },
  vendor: { 
    icon: Store, 
    label: "Vendor",
    color: "text-green-600"
  },
  delivery: { 
    icon: Truck, 
    label: "Rider",
    color: "text-purple-600"
  }
};

export default function AvailableCommunityCard({
  community,
  user,
  getButtonState,
  onJoin
}: AvailableCommunityCardProps) {
  return (
    <Card className="group hover:shadow-elegant hover:scale-[1.02] transition-all duration-300 hover:bg-gradient-to-br hover:from-background hover:to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                <Link to={`/communities/${community.id}`} className="hover:underline">
                  {community.name}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors">
                {community.description || "Join this community to unlock member benefits"}
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 border-green-200"
          >
            {community.member_discount_percent}% off
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Community Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Members</span>
            </div>
            <p className="text-sm font-semibold">Active</p>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Fees</div>
            <p className="text-sm font-semibold">{community.coop_fee_percent + community.community_fee_percent}%</p>
          </div>
        </div>

        {/* Join Options */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-foreground">Join as:</h4>
          <div className="grid gap-2">
            {(Object.keys(roleConfig) as MemberType[]).map((role) => {
              const state = getButtonState(community.id, role);
              const config = roleConfig[role];
              const Icon = config.icon;
              
              return (
                <Button
                  key={role}
                  size="sm"
                  variant={state.variant}
                  onClick={() => onJoin(community.id, role)}
                  disabled={!user || state.disabled}
                  className={`w-full justify-start gap-2 ${
                    state.disabled 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'hover:bg-primary/10'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  {state.icon && <Check className="h-3 w-3 ml-auto" />}
                  <span className="flex-1 text-left">{state.text}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* View Details */}
        <div className="pt-2 border-t">
          <Button 
            size="sm" 
            variant="ghost" 
            asChild 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          >
            <Link to={`/communities/${community.id}`} className="flex items-center justify-center gap-2">
              View Community Details
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Auth Prompt */}
        {!user && (
          <div className="pt-2 border-t">
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link to="/auth">Sign in to Join</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}