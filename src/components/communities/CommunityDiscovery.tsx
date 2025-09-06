import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  MapPin, 
  Users, 
  TrendingUp, 
  Star,
  Filter,
  ChevronRight,
  Heart,
  MessageCircle,
  ShoppingBag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  member_discount_percent: number;
  member_count?: number;
  active_listings?: number;
}

interface CommunityStats {
  totalMembers: number;
  activeListings: number;
  monthlyTransactions: number;
  avgRating: number;
}

export default function CommunityDiscovery() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ [key: string]: CommunityStats }>({});

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [communities, searchQuery, selectedFilter]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      
      // Fetch communities with member counts
      const { data: communitiesData, error } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          logo_url,
          member_discount_percent
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch stats for each community
      const communitiesWithStats = await Promise.all(
        communitiesData.map(async (community) => {
          const statsData = await fetchCommunityStats(community.id);
          return {
            ...community,
            member_count: statsData.totalMembers,
            active_listings: statsData.activeListings
          };
        })
      );

      setCommunities(communitiesWithStats);
      setFilteredCommunities(communitiesWithStats);
    } catch (error: any) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityStats = async (communityId: string): Promise<CommunityStats> => {
    try {
      // Get member count
      const { count: memberCount } = await supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId);

      const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId);

      return {
        totalMembers: memberCount || 0,
        activeListings: productCount || 0,
        monthlyTransactions: Math.floor(Math.random() * 50), // Placeholder
        avgRating: 4.2 + Math.random() * 0.8 // Placeholder
      };
    } catch (error) {
      return {
        totalMembers: 0,
        activeListings: 0,
        monthlyTransactions: 0,
        avgRating: 0
      };
    }
  };

  const filterCommunities = () => {
    let filtered = communities;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

        // Apply category filter
        switch (selectedFilter) {
          case 'popular':
            filtered = filtered.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
            break;
          case 'active':
            filtered = filtered.sort((a, b) => (b.active_listings || 0) - (a.active_listings || 0));
            break;
          case 'new':
            filtered = filtered.reverse(); // Most recently created
            break;
          default:
            // Keep original order
            break;
        }

    setFilteredCommunities(filtered);
  };

  const handleJoinCommunity = (communityId: string) => {
    // Navigate to community detail or onboarding
    window.location.href = `/communities/${communityId}`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search communities by name, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All Communities</TabsTrigger>
            <TabsTrigger value="popular">Most Popular</TabsTrigger>
            <TabsTrigger value="active">Most Active</TabsTrigger>
            <TabsTrigger value="new">Recently Added</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">No communities found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No communities match "${searchQuery}"`
                    : "No communities available yet"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={handleJoinCommunity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommunityCardProps {
  community: Community;
  onJoin: (communityId: string) => void;
}

function CommunityCard({ community, onJoin }: CommunityCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={community.logo_url} alt={community.name} />
              <AvatarFallback>{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{community.name}</CardTitle>
                <Badge variant="secondary" className="h-5 px-2">
                  <Star className="h-3 w-3 mr-1" />
                  Community
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {community.description}
          </p>
        )}

        {/* Community Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">{community.member_count || 0}</span>
            <span className="text-muted-foreground">members</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-green-600" />
            <span className="font-medium">{community.active_listings || 0}</span>
            <span className="text-muted-foreground">listings</span>
          </div>
        </div>

        {/* Member Benefits */}
        {community.member_discount_percent > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-medium text-green-800">
              Member Benefits
            </div>
            <div className="text-xs text-green-600">
              {community.member_discount_percent}% discount on all purchases
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/communities/${community.id}`;
            }}
            className="flex-1"
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onJoin(community.id);
            }}
            className="flex-1"
          >
            Join Community
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
