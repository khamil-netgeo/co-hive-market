import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus, RefreshCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

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
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTimeOff, setSavingTimeOff] = useState(false);
  const [timeOffStart, setTimeOffStart] = useState<string>("");
  const [timeOffEnd, setTimeOffEnd] = useState<string>("");
  const [timeOffReason, setTimeOffReason] = useState<string>("");

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

  const monthStart = useMemo(() => new Date(date.getFullYear(), date.getMonth(), 1), [date]);
  const monthEnd = useMemo(() => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59), [date]);

  useEffect(() => {
    if (!vendorId) return;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("service_bookings")
          .select("id, service_id, scheduled_at, end_at, status")
          .eq("vendor_id", vendorId)
          .gte("scheduled_at", monthStart.toISOString())
          .lte("scheduled_at", monthEnd.toISOString())
          .order("scheduled_at", { ascending: true });
        if (error) throw error;

        // fetch names for distinct services for minimal calls
        const serviceIds = Array.from(new Set((data || []).map((b: any) => b.service_id).filter(Boolean)));
        let nameMap: Record<string, string> = {};
        if (serviceIds.length) {
          const { data: svcRows } = await supabase
            .from("vendor_services")
            .select("id,name")
            .in("id", serviceIds);
          (svcRows || []).forEach((s: any) => (nameMap[s.id] = s.name));
        }
        setBookings((data || []).map((b: any) => ({ ...b, service_name: nameMap[b.service_id] })));
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
    // trigger re-fetch by nudging date state
    setDate(new Date(date));
  };

  const dayBookings = useMemo(() => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    return bookings.filter((b) => {
      if (!b.scheduled_at) return false;
      const t = new Date(b.scheduled_at).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    }).sort((a, b) => (new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()));
  }, [bookings, date]);

  const submitTimeOff = async () => {
    if (!vendorId) return;
    if (!timeOffStart || !timeOffEnd) {
      toast("Start and end time required");
      return;
    }
    try {
      setSavingTimeOff(true);
      const start = new Date(timeOffStart);
      const end = new Date(timeOffEnd);
      if (end <= start) throw new Error("End must be after start");
      const { error } = await supabase
        .from("service_time_off")
        .insert({ vendor_id: vendorId, start_at: start.toISOString(), end_at: end.toISOString(), reason: timeOffReason || null });
      if (error) throw error;
      toast("Time off added");
      setTimeOffStart("");
      setTimeOffEnd("");
      setTimeOffReason("");
      refresh();
    } catch (e: any) {
      toast("Could not add time off", { description: e.message || String(e) });
    } finally {
      setSavingTimeOff(false);
    }
  };

  return (
    <main className="container py-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><CalendarIcon className="h-5 w-5"/>Vendor Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh}><RefreshCcw className="h-4 w-4 mr-2"/>Refresh</Button>
        </div>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Month</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="p-3 pointer-events-auto"
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Loading…</div>
              ) : dayBookings.length === 0 ? (
                <div className="text-muted-foreground">No bookings.</div>
              ) : (
                <ul className="space-y-3">
                  {dayBookings.map((b) => (
                    <li key={b.id} className="rounded-md border p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{b.service_name || 'Service'}</div>
                        <div className="text-sm text-muted-foreground">
                          {b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          {b.end_at ? ` — ${new Date(b.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground">{b.status || 'pending'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4"/>Add Time Off</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="to-start">Start</Label>
                  <Input id="to-start" type="datetime-local" value={timeOffStart} onChange={(e) => setTimeOffStart(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="to-end">End</Label>
                  <Input id="to-end" type="datetime-local" value={timeOffEnd} onChange={(e) => setTimeOffEnd(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="to-reason">Reason (optional)</Label>
                  <Input id="to-reason" value={timeOffReason} onChange={(e) => setTimeOffReason(e.target.value)} placeholder="E.g. holiday" />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={submitTimeOff} disabled={savingTimeOff || !vendorId}>Save time off</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Time-off prevents new bookings in the selected period.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
