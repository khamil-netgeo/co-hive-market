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
import { Calendar, Clock, CheckCircle2, XCircle, Eye, MessageSquare, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import useAuthRoles from "@/hooks/useAuthRoles";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";

interface ServiceBooking {
  id: string;
  created_at: string;
  status: string;
  total_amount_cents: number;
  currency: string;
  scheduled_at: string | null;
  end_at: string | null;
  buyer_user_id: string;
  notes: string | null;
  duration_minutes: number | null;
  service: {
    id: string;
    name: string;
  };
  buyer_profile?: {
    phone: string | null;
  };
}

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

const BookingsDashboard = () => {
  const { user, loading } = useAuthRoles();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(true);

  useEffect(() => {
    setSEO(
      "Service Bookings Dashboard — CoopMarket",
      "Manage your service bookings and customer appointments."
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

  // Fetch service bookings with enhanced data
  const { data: serviceBookings = [], refetch: refetchBookings, isLoading: bookingsLoading } = useQuery<ServiceBooking[]>({
    queryKey: ["vendor-service-bookings-enhanced", vendor?.id],
    enabled: !!vendor?.id,
    queryFn: async () => {
      // 1) Fetch vendor services for this vendor
      const { data: services, error: svcErr } = await supabase
        .from("vendor_services")
        .select("id,name")
        .eq("vendor_id", vendor!.id);
      if (svcErr) throw svcErr;
      const serviceIds = (services || []).map((s: any) => s.id);
      if (serviceIds.length === 0) return [];

      // 2) Fetch bookings with buyer profiles
      const { data: bookings, error: bkErr } = await supabase
        .from("service_bookings")
        .select(`
          id,
          created_at,
          status,
          total_amount_cents,
          currency,
          scheduled_at,
          end_at,
          buyer_user_id,
          notes,
          duration_minutes,
          service_id
        `)
        .in("service_id", serviceIds)
        .order("scheduled_at", { ascending: true });
      if (bkErr) throw bkErr;

      // 3) Get buyer profiles
      const buyerIds = Array.from(new Set((bookings || []).map(b => b.buyer_user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("id", buyerIds);

      // 4) Combine data
      const serviceMap = new Map(services?.map(s => [s.id, s]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (bookings || []).map((b: any) => ({
        ...b,
        service: serviceMap.get(b.service_id) || { id: b.service_id, name: "Unknown Service" },
        buyer_profile: profileMap.get(b.buyer_user_id)
      }));
    },
  });

  // Real-time updates for bookings
  useEffect(() => {
    if (!vendor?.id) return;
    
    const channel = supabase
      .channel('vendor-booking-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_bookings' },
        (payload) => {
          console.log('New booking:', payload);
          toast.success('New service booking received!');
          refetchBookings();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_bookings' },
        () => refetchBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id, refetchBookings]);

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

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return format(new Date(dateString), 'PPP p');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return CheckCircle2;
      case 'scheduled':
        return Clock;
      case 'completed':
        return CheckCircle2;
      case 'cancelled':
      case 'canceled':
        return XCircle;
      default:
        return Clock;
    }
  };

  // Filter bookings by status
  const pendingBookings = serviceBookings.filter(b => ['pending', 'requested'].includes(b.status?.toLowerCase() || ''));
  const confirmedBookings = serviceBookings.filter(b => ['confirmed', 'paid', 'scheduled'].includes(b.status?.toLowerCase() || ''));
  const completedBookings = serviceBookings.filter(b => b.status?.toLowerCase() === 'completed');
  const todaysBookings = serviceBookings.filter(b => {
    if (!b.scheduled_at) return false;
    const today = new Date().toDateString();
    return new Date(b.scheduled_at).toDateString() === today;
  });

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
            Service Bookings Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your service appointments and customer communications
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/vendor/calendar">Calendar View</Link>
          </Button>
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
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{todaysBookings.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Today's Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{pendingBookings.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{confirmedBookings.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{completedBookings.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Management Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedBookings.length})</TabsTrigger>
          <TabsTrigger value="today">Today ({todaysBookings.length})</TabsTrigger>
          <TabsTrigger value="all">All ({serviceBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTable 
                bookings={pendingBookings} 
                onStatusUpdate={updateBookingStatus}
                formatPrice={formatPrice}
                formatDateTime={formatDateTime}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getStatusIcon={getStatusIcon}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTable 
                bookings={confirmedBookings} 
                onStatusUpdate={updateBookingStatus}
                formatPrice={formatPrice}
                formatDateTime={formatDateTime}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getStatusIcon={getStatusIcon}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Today's Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTable 
                bookings={todaysBookings} 
                onStatusUpdate={updateBookingStatus}
                formatPrice={formatPrice}
                formatDateTime={formatDateTime}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getStatusIcon={getStatusIcon}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTable 
                bookings={serviceBookings} 
                onStatusUpdate={updateBookingStatus}
                formatPrice={formatPrice}
                formatDateTime={formatDateTime}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getStatusIcon={getStatusIcon}
                showActions={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface BookingTableProps {
  bookings: ServiceBooking[];
  onStatusUpdate: (id: string, status: string) => void;
  formatPrice: (cents: number, currency: string) => string;
  formatDateTime: (date: string | null) => string;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "outline" | "destructive";
  getStatusIcon: (status: string) => any;
  showActions: boolean;
}

const BookingTable = ({ 
  bookings, 
  onStatusUpdate, 
  formatPrice, 
  formatDateTime, 
  getStatusBadgeVariant, 
  getStatusIcon,
  showActions 
}: BookingTableProps) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
        <p className="text-muted-foreground">
          Bookings will appear here when customers book your services
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {booking.service.name}
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                      Note: {booking.notes}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                     <p className="font-medium">
                       Customer
                     </p>
                    {booking.buyer_profile?.phone && (
                      <p className="text-xs text-muted-foreground">
                        {booking.buyer_profile.phone}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="min-w-[140px]">
                    <p className="text-sm">{formatDateTime(booking.scheduled_at)}</p>
                    {booking.end_at && (
                      <p className="text-xs text-muted-foreground">
                        Ends: {format(new Date(booking.end_at), 'p')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {booking.duration_minutes ? `${booking.duration_minutes} min` : 'N/A'}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatPrice(booking.total_amount_cents, booking.currency)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusBadgeVariant(booking.status)}
                    className="gap-1"
                  >
                    <StatusIcon className="h-3 w-3" />
                    {booking.status}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/chat?vendorId=${booking.service.id}&buyerUserId=${booking.buyer_user_id}`, '_blank')}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      {booking.buyer_profile?.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${booking.buyer_profile?.phone}`, '_self')}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                      <Select
                        value={booking.status}
                        onValueChange={(newStatus) => onStatusUpdate(booking.id, newStatus)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default BookingsDashboard;