import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Store, 
  Truck, 
  TrendingUp, 
  Users,
  Star,
  DollarSign,
  Package,
  CalendarDays,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import useUserRoles from "@/hooks/useUserRoles";
import { Link } from "react-router-dom";

interface CommunityStats {
  communityId: string;
  communityName: string;
  roles: string[];
  buyerStats: {
    ordersCount: number;
    totalSpent: number;
    favoriteVendor: string | null;
  };
  vendorStats: {
    productsCount: number;
    ordersReceived: number;
    totalEarned: number;
    rating: number;
  };
  riderStats: {
    deliveriesCompleted: number;
    totalEarned: number;
    rating: number;
    activeHours: number;
  };
}

interface CommunityRoleStatsProps {
  communitiesById: Record<string, { id: string; name: string }>;
}

const roleConfig = {
  buyer: {
    icon: ShoppingCart,
    label: "Buyer",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    metrics: [
      { key: 'ordersCount', label: 'Orders', icon: Package },
      { key: 'totalSpent', label: 'Total Spent', icon: DollarSign, format: 'currency' }
    ]
  },
  vendor: {
    icon: Store,
    label: "Vendor", 
    color: "text-green-600",
    bgColor: "bg-green-50",
    metrics: [
      { key: 'productsCount', label: 'Products', icon: Package },
      { key: 'ordersReceived', label: 'Orders', icon: ShoppingCart },
      { key: 'totalEarned', label: 'Earned', icon: DollarSign, format: 'currency' },
      { key: 'rating', label: 'Rating', icon: Star, format: 'rating' }
    ]
  },
  delivery: {
    icon: Truck,
    label: "Rider",
    color: "text-orange-600",
    bgColor: "bg-orange-50", 
    metrics: [
      { key: 'deliveriesCompleted', label: 'Deliveries', icon: Package },
      { key: 'totalEarned', label: 'Earned', icon: DollarSign, format: 'currency' },
      { key: 'rating', label: 'Rating', icon: Star, format: 'rating' },
      { key: 'activeHours', label: 'Active Hours', icon: CalendarDays }
    ]
  }
};

export default function CommunityRoleStats({ communitiesById }: CommunityRoleStatsProps) {
  const { roles, loading } = useUserRoles();
  const [stats, setStats] = useState<CommunityStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (roles.length > 0) {
      fetchCommunityStats();
    }
  }, [roles]);

  const fetchCommunityStats = async () => {
    setLoadingStats(true);
    try {
      // Group roles by community
      const rolesByCommnity = roles.reduce((acc, role) => {
        const communityId = role.community_id;
        if (!acc[communityId]) {
          acc[communityId] = {
            communityId,
            communityName: communitiesById[communityId]?.name || 'Unknown Community',
            roles: []
          };
        }
        acc[communityId].roles.push(role.member_type);
        return acc;
      }, {} as Record<string, any>);

      // Fetch stats for each community
      const statsPromises = Object.values(rolesByCommnity).map(async (community: any) => {
        const communityStats: CommunityStats = {
          ...community,
          buyerStats: { ordersCount: 0, totalSpent: 0, favoriteVendor: null },
          vendorStats: { productsCount: 0, ordersReceived: 0, totalEarned: 0, rating: 0 },
          riderStats: { deliveriesCompleted: 0, totalEarned: 0, rating: 0, activeHours: 0 }
        };

        // Fetch buyer stats if user is a buyer in this community
        if (community.roles.includes('buyer')) {
          // Mock data for now - replace with actual queries
          communityStats.buyerStats = {
            ordersCount: Math.floor(Math.random() * 50) + 1,
            totalSpent: Math.floor(Math.random() * 5000) + 100,
            favoriteVendor: 'Local Bakery'
          };
        }

        // Fetch vendor stats if user is a vendor in this community  
        if (community.roles.includes('vendor')) {
          communityStats.vendorStats = {
            productsCount: Math.floor(Math.random() * 25) + 1,
            ordersReceived: Math.floor(Math.random() * 100) + 5,
            totalEarned: Math.floor(Math.random() * 10000) + 500,
            rating: (Math.random() * 2 + 3).toFixed(1) as any
          };
        }

        // Fetch rider stats if user is a rider in this community
        if (community.roles.includes('delivery')) {
          communityStats.riderStats = {
            deliveriesCompleted: Math.floor(Math.random() * 150) + 10,
            totalEarned: Math.floor(Math.random() * 3000) + 200,
            rating: (Math.random() * 2 + 3).toFixed(1) as any,
            activeHours: Math.floor(Math.random() * 200) + 50
          };
        }

        return communityStats;
      });

      const communityStats = await Promise.all(statsPromises);
      setStats(communityStats);
    } catch (error) {
      console.error('Error fetching community stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatMetricValue = (value: any, format?: string) => {
    if (format === 'currency') {
      return `$${value.toLocaleString()}`;
    }
    if (format === 'rating') {
      return `${value}/5`;
    }
    return value.toLocaleString();
  };

  if (loading || stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Performance</CardTitle>
          <CardDescription>Loading your community statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Community Performance
        </CardTitle>
        <CardDescription>
          Your performance and engagement across different communities and roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((community) => (
          <div key={community.communityId} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{community.communityName}</h3>
                  <div className="flex items-center gap-2">
                    {community.roles.map(role => {
                      const config = roleConfig[role as keyof typeof roleConfig];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <Badge key={role} variant="outline" className="text-xs flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          <span>{config.label}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/communities/${community.communityId}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {community.roles.map(role => {
                const config = roleConfig[role as keyof typeof roleConfig];
                const Icon = config.icon;
                const statsKey = `${role}Stats` as keyof CommunityStats;
                const roleStats = community[statsKey] as any;

                // Skip if config or roleStats are undefined
                if (!config || !roleStats) {
                  return null;
                }

                return (
                  <div key={role} className={`p-4 rounded-lg border ${config.bgColor}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`h-4 w-4 ${config.color} flex-shrink-0`} />
                      <span className="font-medium text-sm whitespace-nowrap">{config.label}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {config.metrics.map((metric) => {
                        const MetricIcon = metric.icon;
                        const value = roleStats[metric.key] ?? 0;
                        
                        return (
                          <div key={metric.key} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MetricIcon className="h-3 w-3" />
                              {metric.label}
                            </div>
                            <div className="font-medium">
                              {formatMetricValue(value, metric.format)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {community !== stats[stats.length - 1] && <Separator />}
          </div>
        ))}

        {loadingStats && (
          <div className="text-center py-8 text-muted-foreground">
            Loading community statistics...
          </div>
        )}
      </CardContent>
    </Card>
  );
}