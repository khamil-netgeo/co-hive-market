import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Plus, RefreshCcw, Clock, MapPin, User, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

interface BookingRow {
  id: string;
  service_id: string;
  scheduled_at: string | null;
  end_at: string | null;
  status: string | null;
  service_name?: string;
}

export default function VendorCalendar() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [timeOffBlocks, setTimeOffBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTimeOff, setSavingTimeOff] = useState(false);
  const [timeOffStart, setTimeOffStart] = useState<Date | undefined>();
  const [timeOffEnd, setTimeOffEnd] = useState<Date | undefined>();
  const [timeOffReason, setTimeOffReason] = useState<string>("");

  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | 'all'>('all');

  // Deterministic service color mapping using design tokens
  const servicePalette = ['--chart-1','--chart-2','--chart-3','--chart-4','--chart-5','--chart-6','--chart-7','--chart-8'] as const;
  const serviceColorVar = (serviceId?: string) => {
    if (!serviceId) return servicePalette[0];
    const idx = services.findIndex((s) => s.id === serviceId);
    const mapped = idx >= 0 ? servicePalette[idx % servicePalette.length] : servicePalette[0];
    return mapped;
  };


  const [searchParams, setSearchParams] = useSearchParams();
  const handleServiceChange = (value: string) => {
    setSelectedServiceId(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('service');
    } else {
      params.set('service', value);
    }
    setSearchParams(params);
  };
  useEffect(() => {
    setSEO("Vendor Calendar | CoopMarket", "Manage your service bookings and time-off.");
    const bootstrap = async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) return;
      const { data: v } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (v?.id) setVendorId(v.id);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    const svc = searchParams.get('service');
    if (svc) setSelectedServiceId(svc);
  }, [searchParams]);
  const monthStart = useMemo(() => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1), [viewMonth]);
  const monthEnd = useMemo(() => new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59), [viewMonth]);

  useEffect(() => {
    if (!vendorId) return;
    const load = async () => {
      try {
        setLoading(true);
        
        // Load bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("service_bookings")
          .select("id, service_id, scheduled_at, end_at, status")
          .eq("vendor_id", vendorId)
          .gte("scheduled_at", monthStart.toISOString())
          .lte("scheduled_at", monthEnd.toISOString())
          .order("scheduled_at", { ascending: true });
        if (bookingsError) throw bookingsError;

        // Load time-off blocks for the current month
        const { data: timeOffData, error: timeOffError } = await supabase
          .from("service_time_off")
          .select("*")
          .eq("vendor_id", vendorId)
          .gte("start_at", monthStart.toISOString())
          .lte("end_at", monthEnd.toISOString())
          .order("start_at", { ascending: true });
        if (timeOffError) {
          console.error("Failed to load time off blocks:", timeOffError);
        } else {
          setTimeOffBlocks(timeOffData || []);
        }

        // fetch names for distinct services for minimal calls
        const serviceIds = Array.from(new Set((bookingsData || []).map((b: any) => b.service_id).filter(Boolean)));
        let nameMap: Record<string, string> = {};
        if (serviceIds.length) {
          const { data: svcRows } = await supabase
            .from("vendor_services")
            .select("id,name")
            .in("id", serviceIds);
          (svcRows || []).forEach((s: any) => (nameMap[s.id] = s.name));
        }
        setBookings((bookingsData || []).map((b: any) => ({ ...b, service_name: nameMap[b.service_id] })));

        // Load all services for this vendor (for filter)
        const { data: svcList } = await supabase
          .from('vendor_services')
          .select('id,name')
          .eq('vendor_id', vendorId)
          .order('name', { ascending: true });
        setServices(svcList || []);
      } catch (e: any) {
        toast("Failed to load calendar", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId, monthStart, monthEnd]);

  useEffect(() => {
    if (!vendorId) return;
    const channel = supabase
      .channel("vendor-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_bookings", filter: `vendor_id=eq.${vendorId}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_bookings", filter: `vendor_id=eq.${vendorId}` },
        () => refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const refresh = async () => {
    setViewMonth(new Date(viewMonth));
  };

  // Helper function to get status styling
  const getStatusStyle = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'confirmed':
        return { variant: "default" as const, icon: CheckCircle2, color: "text-green-600" };
      case 'scheduled':
        return { variant: "secondary" as const, icon: Clock, color: "text-blue-600" };
      case 'cancelled':
        return { variant: "destructive" as const, icon: XCircle, color: "text-red-600" };
      default:
        return { variant: "outline" as const, icon: AlertCircle, color: "text-orange-600" };
    }
  };

  // Filter bookings by selected service
  const filteredBookings = useMemo(() => {
    return selectedServiceId === 'all' ? bookings : bookings.filter(b => b.service_id === selectedServiceId);
  }, [bookings, selectedServiceId]);

  // Get days with bookings for calendar highlighting
  const bookedDays = useMemo(() => {
    return filteredBookings.map(b => b.scheduled_at ? new Date(b.scheduled_at) : null).filter(Boolean) as Date[];
  }, [filteredBookings]);

  // Get days with time-off blocks for calendar highlighting
  const blockedDays = useMemo(() => {
    const days: Date[] = [];
    timeOffBlocks.forEach(block => {
      const start = new Date(block.start_at);
      const end = new Date(block.end_at);
      const current = new Date(start);
      
      // Add each day in the time-off period
      while (current <= end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return days;
  }, [timeOffBlocks]);

  // Build per-day unique service ids for colored dots
  const dayServiceMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    filteredBookings.forEach((b) => {
      if (!b.scheduled_at || !b.service_id) return;
      const d = new Date(b.scheduled_at);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      if (!map[key].includes(b.service_id)) map[key].push(b.service_id);
    });
    return map;
  }, [filteredBookings]);

  const dayBookings = useMemo(() => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    return filteredBookings.filter((b) => {
      if (!b.scheduled_at) return false;
      const t = new Date(b.scheduled_at).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    }).sort((a, b) => (new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()));
  }, [filteredBookings, date]);

  // Count bookings per service for current month (for legend)
  const serviceMonthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (!b.service_id) return;
      counts[b.service_id] = (counts[b.service_id] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  const submitTimeOff = async () => {
    if (!vendorId) return;
    if (!timeOffStart || !timeOffEnd) {
      toast("Start and end time required");
      return;
    }
    try {
      setSavingTimeOff(true);
      if (timeOffEnd <= timeOffStart) throw new Error("End must be after start");
      const { error } = await supabase
        .from("service_time_off")
        .insert({ vendor_id: vendorId, start_at: timeOffStart.toISOString(), end_at: timeOffEnd.toISOString(), reason: timeOffReason || null });
      if (error) throw error;
      toast("Time off added successfully!");
      setTimeOffStart(undefined);
      setTimeOffEnd(undefined);
      setTimeOffReason("");
      refresh();
    } catch (e: any) {
      toast("Could not add time off", { description: e.message || String(e) });
    } finally {
      setSavingTimeOff(false);
    }
  };

  const bookingStats = useMemo(() => {
    const today = new Date();
    const todayBookings = filteredBookings.filter(b => 
      b.scheduled_at && new Date(b.scheduled_at).toDateString() === today.toDateString()
    );
    const upcomingBookings = filteredBookings.filter(b => 
      b.scheduled_at && new Date(b.scheduled_at) > today
    );
    const confirmedBookings = filteredBookings.filter(b => 
      b.status && ['paid', 'confirmed', 'scheduled'].includes(b.status.toLowerCase())
    );
    
    return {
      today: todayBookings.length,
      upcoming: upcomingBookings.length,
      confirmed: confirmedBookings.length,
      total: filteredBookings.length
    };
  }, [filteredBookings]);

  return (
    <main className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarIcon className="h-6 w-6 text-primary"/>
            </div>
            Calendar Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage your service bookings and availability</p>
        </div>
        <Button variant="outline" onClick={refresh} className="gap-2">
          <RefreshCcw className="h-4 w-4"/>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950">
                <Clock className="h-4 w-4 text-blue-600"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{bookingStats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{bookingStats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950">
                <CalendarIcon className="h-4 w-4 text-purple-600"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{bookingStats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-950">
                <User className="h-4 w-4 text-orange-600"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{bookingStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-3 gap-8">
        {/* Calendar */}
        <Card className="xl:col-span-3 lg:col-span-2 md:col-span-2 col-span-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5"/>
              Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-sm font-medium min-w-[80px]">Service</Label>
              <Select value={selectedServiceId} onValueChange={handleServiceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month/Year Navigation */}
            <div className="flex items-center gap-3 pb-3 border-b">
              <Select
                value={viewMonth.getMonth().toString()}
                onValueChange={(value) => {
                  const newMonth = new Date(viewMonth);
                  newMonth.setMonth(parseInt(value));
                  setViewMonth(newMonth);
                }}
              >
                <SelectTrigger className="w-auto min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {new Date(0, i).toLocaleDateString(undefined, { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={viewMonth.getFullYear().toString()}
                onValueChange={(value) => {
                  const newMonth = new Date(viewMonth);
                  newMonth.setFullYear(parseInt(value));
                  setViewMonth(newMonth);
                }}
              >
                <SelectTrigger className="w-auto min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Grid */}
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="p-0 pointer-events-auto"
              modifiers={{
                booked: bookedDays,
                blocked: blockedDays
              }}
              modifiersStyles={{
                booked: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                },
                blocked: {
                  backgroundColor: 'hsl(var(--destructive))',
                  color: 'hsl(var(--destructive-foreground))',
                  fontWeight: 'bold',
                  textDecoration: 'line-through'
                }
              }}
              month={viewMonth}
              onMonthChange={setViewMonth}
              components={{
                Caption: () => null, // Hide default caption since we have custom selects
              }}
            />
            
            {/* Legend */}
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Days with bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span>Blocked time</span>
                </div>
              </div>
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedServiceId === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleServiceChange('all')}
                  >
                    All ({bookings.length})
                  </Badge>
                  {services.map((s, i) => (
                    <Badge
                      key={s.id}
                      variant={selectedServiceId === s.id ? 'default' : 'secondary'}
                      className="cursor-pointer flex items-center gap-2"
                      onClick={() => handleServiceChange(s.id)}
                    >
                      <span
                        aria-hidden
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: `hsl(var(${serviceColorVar(s.id)}))` }}
                      />
                      {s.name} ({serviceMonthCounts[s.id] || 0})
                    </Badge>
                  ))}

                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="xl:col-span-4 lg:col-span-3 md:col-span-1 col-span-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5"/>
                {date.toLocaleDateString(undefined, { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              {dayBookings.length > 0 && (
                <Badge variant="secondary">{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading bookings...
                </div>
              </div>
            ) : dayBookings.length === 0 ? (
              <div className="text-center p-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4"/>
                <h3 className="font-medium text-muted-foreground">No bookings today</h3>
                <p className="text-sm text-muted-foreground">Your schedule is clear for this day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dayBookings.map((booking, index) => {
                  const statusInfo = getStatusStyle(booking.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={booking.id} className="group">
                      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors border-l-4" style={{ borderLeftColor: `hsl(var(${serviceColorVar(booking.service_id)}))` }}>
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-full bg-background border ${statusInfo.color}`}>
                            <StatusIcon className="h-4 w-4"/>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{booking.service_name || 'Service'}</h4>
                            <Badge variant={statusInfo.variant} className="text-xs">
                              {booking.status || 'pending'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3"/>
                              {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : '--'}
                              {booking.end_at && (
                                <span>
                                  {' — '}
                                  {new Date(booking.end_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < dayBookings.length - 1 && (
                        <div className="flex justify-center my-2">
                          <div className="w-px h-4 bg-border"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Off Section */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5"/>
            Block Time Off
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Schedule unavailable periods to prevent new bookings during those times.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <DateTimePicker
              value={timeOffStart}
              onChange={setTimeOffStart}
              label="Start Date & Time"
              placeholder="Pick a date"
              disabled={savingTimeOff}
            />
            
            <DateTimePicker
              value={timeOffEnd}
              onChange={setTimeOffEnd}
              label="End Date & Time"
              placeholder="Pick a date"
              disabled={savingTimeOff}
            />
            
            <div className="space-y-2">
              <Label htmlFor="to-reason" className="text-sm font-medium">Reason (Optional)</Label>
              <Input 
                id="to-reason" 
                value={timeOffReason} 
                onChange={(e) => setTimeOffReason(e.target.value)} 
                placeholder="e.g., Holiday, Personal time"
                className="w-full"
                disabled={savingTimeOff}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">&nbsp;</Label>
              <Button 
                onClick={submitTimeOff} 
                disabled={savingTimeOff || !vendorId || !timeOffStart || !timeOffEnd}
                className="w-full gap-2"
              >
                {savingTimeOff ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4"/>
                    Block Time
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Display existing time-off blocks */}
          {timeOffBlocks.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4"/>
                Blocked Time Periods ({timeOffBlocks.length})
              </h4>
              <div className="space-y-3">
                {timeOffBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3"/>
                          {new Date(block.start_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3"/>
                          {new Date(block.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {new Date(block.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {block.reason && (
                        <p className="text-xs text-muted-foreground mt-1">{block.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("service_time_off")
                            .delete()
                            .eq("id", block.id);
                          if (error) throw error;
                          toast("Time off block removed");
                          refresh();
                        } catch (e: any) {
                          toast("Failed to remove time off", { description: e.message });
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4"/>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
