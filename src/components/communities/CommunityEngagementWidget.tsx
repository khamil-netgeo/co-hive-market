import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  MessageSquare, 
  Star, 
  Gift,
  Award,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommunityActivity {
  id: string;
  type: 'new_member' | 'new_listing' | 'transaction' | 'review';
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
  user_avatar?: string;
}

interface CommunityEngagementWidgetProps {
  communityId: string;
}

export default function CommunityEngagementWidget({ 
  communityId 
}: CommunityEngagementWidgetProps) {
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [stats, setStats] = useState({
    weeklyGrowth: 0,
    activeMembers: 0,
    recentTransactions: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityEngagement();
  }, [communityId]);

  const fetchCommunityEngagement = async () => {
    try {
      setLoading(true);
      
      // Fetch recent activities (simulated for now)
      const mockActivities: CommunityActivity[] = [
        {
          id: '1',
          type: 'new_member',
          title: 'New member joined',
          description: 'Sarah Johnson joined as a vendor',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          user_name: 'Sarah Johnson',
          user_avatar: ''
        },
        {
          id: '2',
          type: 'new_listing',
          title: 'New product listed',
          description: 'Fresh organic tomatoes now available',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user_name: 'Green Valley Farm'
        },
        {
          id: '3',
          type: 'transaction',
          title: 'Order completed',
          description: 'Local delivery successful',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        },
        {
          id: '4',
          type: 'review',
          title: 'New 5-star review',
          description: 'Excellent service and quality!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        }
      ];

      setActivities(mockActivities);

      // Fetch community stats
      const { count: memberCount } = await supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId);

      setStats({
        weeklyGrowth: 12,
        activeMembers: memberCount || 0,
        recentTransactions: 8,
        avgRating: 4.7
      });

    } catch (error) {
      console.error('Error fetching community engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_member':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'new_listing':
        return <Gift className="h-4 w-4 text-green-600" />;
      case 'transaction':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'review':
        return <Star className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-5 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Community Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{stats.weeklyGrowth}%</div>
              <div className="text-xs text-muted-foreground">Weekly Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.activeMembers}</div>
              <div className="text-xs text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.recentTransactions}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.avgRating}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    {activity.user_name && (
                      <div className="flex items-center mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={activity.user_avatar} alt={activity.user_name} />
                          <AvatarFallback className="text-xs">
                            {activity.user_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground ml-2">
                          {activity.user_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {index < activities.length - 1 && <Separator className="mt-4" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Community Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Community Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <div className="font-medium text-yellow-800">Top Rated Community</div>
                <div className="text-sm text-yellow-600">
                  Ranked #1 for customer satisfaction this month
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <div className="font-medium text-green-800">Growing Community</div>
                <div className="text-sm text-green-600">
                  50+ new members joined this month
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}