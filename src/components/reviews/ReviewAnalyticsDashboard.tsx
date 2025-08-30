import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Star, TrendingUp, Users, ThumbsUp } from "lucide-react";
import { useReviewAnalytics } from "@/hooks/useReviews";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

type Props = {
  targetType: "product" | "service";
  targetId: string;
  className?: string;
};

export default function ReviewAnalyticsDashboard({ targetType, targetId, className }: Props) {
  const { data: analytics, isLoading } = useReviewAnalytics(targetType, targetId);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Review Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || analytics.totalReviews === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Review Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reviews data available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform monthly trend data for chart
  const trendData = Object.entries(analytics.monthlyTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      reviews: count
    }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{analytics.totalReviews}</div>
                <div className="text-xs text-muted-foreground">Total Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{analytics.helpfulnessStats.totalVotes}</div>
                <div className="text-xs text-muted-foreground">Helpful Votes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{analytics.helpfulnessStats.averageHelpfulness.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg Helpfulness</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = analytics.ratingDistribution[rating] || 0;
              const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <div className="w-12 text-right">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Detailed Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.averageDetailedRatings).map(([category, rating]) => {
              const numRating = Number(rating);
              if (!numRating || numRating === 0) return null;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <Badge variant="outline">
                      {numRating.toFixed(1)} ★
                    </Badge>
                  </div>
                  <Progress value={(numRating / 5) * 100} className="h-2" />
                </div>
              );
            })}
            
            {Object.values(analytics.averageDetailedRatings).every((rating) => {
              const numRating = Number(rating);
              return !numRating || numRating === 0;
            }) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No detailed ratings available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-sm text-primary">
                              Reviews: {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reviews" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}