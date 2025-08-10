import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Clock, Star, TrendingUp, Package } from "lucide-react";
import { useDeliveryAssignments } from "@/hooks/useDeliveryAssignments";
import { Link } from "react-router-dom";

export default function RiderDashboard() {
  const { assignments, loading } = useDeliveryAssignments();
  
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const activeDeliveries = assignments.filter(a => a.status === 'accepted');

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rider Dashboard</h1>
          <p className="text-muted-foreground">Manage your food & grocery deliveries</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          Active Rider
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{activeDeliveries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Earnings</p>
                <p className="text-2xl font-bold">RM 128</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Clock className="h-5 w-5" />
              New Delivery Requests ({pendingAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-background border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">New Request</Badge>
                      <span className="text-sm text-muted-foreground">
                        Order #{assignment.delivery?.order_id}
                      </span>
                    </div>
                    {assignment.delivery?.pickup_address && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {assignment.delivery.pickup_address}
                      </div>
                    )}
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/rider/assignments">View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Deliveries ({activeDeliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeDeliveries.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">In Progress</Badge>
                      <span className="text-sm text-muted-foreground">
                        Order #{assignment.delivery?.order_id}
                      </span>
                    </div>
                    {assignment.delivery?.dropoff_address && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        Delivering to: {assignment.delivery.dropoff_address}
                      </div>
                    )}
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/rider/deliveries">Manage</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/rider/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">View Assignments</h3>
              <p className="text-sm text-muted-foreground">Accept new delivery requests</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/rider/deliveries">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Active Deliveries</h3>
              <p className="text-sm text-muted-foreground">Manage ongoing deliveries</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/rider/payouts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Earnings</h3>
              <p className="text-sm text-muted-foreground">View your payouts</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading assignments...</p>
        </div>
      )}

      {!loading && pendingAssignments.length === 0 && activeDeliveries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No active deliveries</h3>
            <p className="text-muted-foreground mb-4">
              You'll receive notifications when new delivery requests are available in your area.
            </p>
            <Button asChild>
              <Link to="/rider/profile">Update Availability</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}