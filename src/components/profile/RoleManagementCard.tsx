import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Store, Truck, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import useUserRoles from "@/hooks/useUserRoles";

interface RoleManagementCardProps {
  communitiesById: Record<string, { id: string; name: string }>;
  vendors: Array<{ id: string; display_name: string; community_id: string; active: boolean }>;
  ordersCount?: number;
  deliveriesCount?: number;
}

const roleConfig = {
  buyer: {
    icon: ShoppingCart,
    label: "Buyer",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Browse and purchase from vendors",
    setupSteps: ["Complete profile", "Add payment method", "Set delivery address"],
    dashboardLink: "/orders"
  },
  vendor: {
    icon: Store,
    label: "Vendor",
    color: "text-green-600", 
    bgColor: "bg-green-50",
    description: "Sell products and manage your store",
    setupSteps: ["Complete KYC verification", "Add products", "Set up payout method"],
    dashboardLink: "/vendor/dashboard"
  },
  delivery: {
    icon: Truck,
    label: "Rider",
    color: "text-orange-600",
    bgColor: "bg-orange-50", 
    description: "Deliver orders and earn money",
    setupSteps: ["Complete KYC verification", "Vehicle verification", "Set availability"],
    dashboardLink: "/rider"
  }
};

export default function RoleManagementCard({ 
  communitiesById, 
  vendors, 
  ordersCount = 0, 
  deliveriesCount = 0 
}: RoleManagementCardProps) {
  const { roles, loading } = useUserRoles();
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");

  const getCommunityRoles = (communityId: string) => {
    return roles.filter(role => role.community_id === communityId);
  };

  const getRoleProgress = (roleType: 'buyer' | 'vendor' | 'delivery') => {
    // Mock progress calculation - in real app, check actual completion
    switch (roleType) {
      case 'buyer':
        return ordersCount > 0 ? 100 : 60;
      case 'vendor':
        return vendors.length > 0 ? 90 : 30;
      case 'delivery':
        return deliveriesCount > 0 ? 100 : 45;
      default:
        return 0;
    }
  };

  const getRoleStats = (roleType: 'buyer' | 'vendor' | 'delivery') => {
    switch (roleType) {
      case 'buyer':
        return `${ordersCount} orders completed`;
      case 'vendor':
        return `${vendors.length} stores active`;
      case 'delivery':
        return `${deliveriesCount} deliveries completed`;
      default:
        return "Getting started";
    }
  };

  const communities = Object.values(communitiesById);
  const communityIds = roles.map(role => role.community_id);
  const uniqueCommunityIds = Array.from(new Set(communityIds));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>Loading your roles...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Role Management
          <Badge variant="secondary">{roles.length} active roles</Badge>
        </CardTitle>
        <CardDescription>
          Manage your roles across communities and track your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uniqueCommunityIds.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              You haven't joined any communities yet
            </div>
            <Button asChild>
              <Link to="/getting-started">Join Your First Community</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {uniqueCommunityIds.map(communityId => {
              const community = communitiesById[communityId];
              const communityRoles = getCommunityRoles(communityId);
              
              return (
                <div key={communityId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {community?.name || 'Unknown Community'}
                    </h3>
                    <Badge variant="outline">
                      {communityRoles.length} role{communityRoles.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                   <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                     {Object.entries(roleConfig).map(([roleKey, config]) => {
                       const hasRole = communityRoles.some(role => role.member_type === roleKey);
                       const progress = hasRole ? getRoleProgress(roleKey as any) : 0;
                       const stats = hasRole ? getRoleStats(roleKey as any) : "Not joined";
                       const Icon = config.icon;
                       
                       return (
                         <div
                           key={roleKey}
                           className={`relative h-full p-5 rounded-xl border transition-all duration-300 ${
                             hasRole 
                               ? 'border-primary/30 bg-gradient-to-br from-primary/8 to-primary/12 shadow-lg hover:shadow-xl' 
                               : 'border-dashed border-muted-foreground/40 hover:border-primary/60 hover:bg-muted/30 hover:shadow-md'
                           }`}
                         >
                           <div className="flex flex-col h-full">
                             {/* Header Section */}
                             <div className="flex items-start gap-3 mb-4">
                               <div className={`p-3 rounded-xl ${config.bgColor} ring-2 ring-white/50 shadow-sm`}>
                                 <Icon className={`h-6 w-6 ${config.color}`} />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-2">
                                   <h4 className="font-bold text-base leading-tight">{config.label}</h4>
                                   {hasRole && (
                                     <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                   )}
                                 </div>
                                 <p className="text-sm text-muted-foreground leading-relaxed">
                                   {config.description}
                                 </p>
                               </div>
                             </div>
                             
                             {/* Stats Section */}
                             <div className="mb-4 flex-grow">
                               <div className={`text-sm font-semibold text-center py-3 rounded-lg ${
                                 hasRole 
                                   ? 'bg-primary/10 text-primary border border-primary/20' 
                                   : 'bg-muted/60 text-muted-foreground border border-muted'
                               }`}>
                                 {stats}
                               </div>
                             </div>
                             
                             {/* Progress and Actions Section */}
                             <div className="mt-auto space-y-4">
                               {hasRole ? (
                                 <>
                                   <div className="space-y-3">
                                     <div className="flex justify-between text-sm font-medium">
                                       <span className="text-muted-foreground">Setup Progress</span>
                                       <span className="text-primary">{progress}%</span>
                                     </div>
                                     <Progress value={progress} className="h-3 bg-muted/30" />
                                   </div>
                                   
                                   <div className="flex gap-2">
                                     <Button size="sm" variant="default" className="flex-1 font-medium" asChild>
                                       <Link to={config.dashboardLink}>
                                         Dashboard
                                       </Link>
                                     </Button>
                                     {progress < 100 && (
                                       <Button size="sm" variant="outline" className="flex-1 font-medium">
                                         <AlertCircle className="h-4 w-4 mr-1" />
                                         Complete
                                       </Button>
                                     )}
                                   </div>
                                 </>
                               ) : (
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="w-full font-medium py-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                                   asChild
                                 >
                                   <Link to={`/getting-started?community=${communityId}&role=${roleKey}`}>
                                     <Plus className="h-4 w-4 mr-2" />
                                     Join as {config.label}
                                   </Link>
                                 </Button>
                               )}
                             </div>
                           </div>
                         </div>
                       );
                     })}
                  </div>
                </div>
              );
            })}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Want to explore more communities?
              </div>
              <Button variant="outline" asChild>
                <Link to="/communities">
                  Browse Communities
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}