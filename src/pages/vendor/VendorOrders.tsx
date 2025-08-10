import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Calendar, Eye, DollarSign, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import useAuthRoles from "@/hooks/useAuthRoles";
import { useNavigate, Link } from "react-router-dom";

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'paid' | 'canceled' | 'fulfilled' | 'refunded';
  total_amount_cents: number;
  currency: string;
  buyer_user_id: string;
  order_items?: {
    id: string;
    quantity: number;
    unit_price_cents: number;
    products: {
      name: string;
    };
  }[];
}

interface ServiceBooking {
  id: string;
  created_at: string;
  status: string;
  total_amount_cents: number;
  currency: string;
  scheduled_at: string | null;
  buyer_user_id: string;
  notes: string | null;
  service: {
    name: string;
  };
}

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

const VendorOrders = () => {
  const { user, loading } = useAuthRoles();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(true);

  useEffect(() => {
    setSEO(
      "Vendor Orders — CoopMarket",
      "Manage your product orders and service bookings."
    );
    
    if (user && !loading) {
      fetchVendorData();
    }
  }, [user, loading]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;

      if (!vendorData) {
        toast.error("You don't have a vendor profile. Please join as a vendor first.");
        navigate("/getting-started");
        return;
      }

      setVendor(vendorData);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setLoadingVendor(false);
    }
  };

  // Fetch product orders
  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["vendor-orders", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total_amount_cents,
          currency,
          buyer_user_id,
          order_items (
            id,
            quantity,
            unit_price_cents,
            products (name)
          )
        `)
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch service bookings
  const { data: serviceBookings = [], refetch: refetchBookings, isLoading: bookingsLoading } = useQuery<ServiceBooking[]>({
    queryKey: ["vendor-service-bookings", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select(`
          id,
          created_at,
          status,
          total_amount_cents,
          currency,
          scheduled_at,
          buyer_user_id,
          notes,
          vendor_services!inner (name)
        `)
        .eq("vendor_services.vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map(booking => ({
        ...booking,
        service: { name: (booking as any).vendor_services.name }
      })) as ServiceBooking[];
    },
  });

  useEffect(() => {
    if (!vendor?.id) return;
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch {}
    const channel = supabase
      .channel('vendor-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendor!.id}` },
        (payload) => {
          const id = (payload.new as any)?.id as string;
          toast.success('New order received', { description: id ? id.slice(0, 8) : 'New order' });
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New order', { body: `Order ${id?.slice(0, 8) || ''} placed` });
            }
          } catch {}
          refetchOrders();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id, refetchOrders]);

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'paid' | 'canceled' | 'fulfilled' | 'refunded') => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success("Order status updated");
      refetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const addEvent = async (orderId: string, event: string, description?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Please sign in to update order");
        return;
      }
      const { error } = await supabase.from("order_progress_events").insert({
        order_id: orderId,
        event,
        description: description ?? null,
        created_by: session.session.user.id,
      });
      if (error) throw error;
      toast.success("Update sent");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send update");
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      
      toast.success("Booking status updated");
      refetchBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'paid':
      case 'confirmed':
      case 'processing':
        return 'outline';
      case 'cancelled':
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Calculate stats
  const totalOrders = orders.length + serviceBookings.length;
  const completedOrders = orders.filter(o => o.status === 'fulfilled').length + 
                          serviceBookings.filter(b => b.status === 'completed').length;
  const totalRevenue = [...orders, ...serviceBookings]
    .filter(item => item.status === 'fulfilled' || item.status === 'completed')
    .reduce((sum, item) => sum + item.total_amount_cents, 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length + 
                       serviceBookings.filter(b => b.status === 'pending').length;

  if (loading || loadingVendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !vendor) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">
            Order Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your product orders and service bookings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/vendor/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{completedOrders}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold">{formatPrice(totalRevenue, 'MYR')}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders and Bookings Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Product Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="bookings">Service Bookings ({serviceBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Product Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">
                    Orders will appear here when customers purchase your products
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.order_items?.map((item) => (
                                <div key={item.id} className="text-sm">
                                  {item.quantity}x {item.products?.name || 'Unknown Product'}
                                </div>
                              )) || <span className="text-muted-foreground">No items</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(order.total_amount_cents, order.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Service Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <p className="text-sm text-muted-foreground">Loading bookings...</p>
              ) : serviceBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground">
                    Service bookings will appear here when customers book your services
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">
                            {booking.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.service.name}</div>
                              {booking.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {booking.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {booking.scheduled_at 
                              ? formatDate(booking.scheduled_at)
                              : 'Not scheduled'
                            }
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(booking.total_amount_cents, booking.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(booking.status)}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(newStatus) => updateBookingStatus(booking.id, newStatus)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorOrders;