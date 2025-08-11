import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { trackEasyParcel } from "@/lib/shipping";
import { buildICS, downloadICS, googleCalendarUrl } from "@/lib/calendar";
export default function PaymentSuccess() {
  const [verifying, setVerifying] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [riderUserId, setRiderUserId] = useState<string | null>(null);
  const [rebroadcasting, setRebroadcasting] = useState(false);
  const rebroadcastTimer = useRef<number | null>(null);
  const { clear } = useCart();
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [awbNo, setAwbNo] = useState<string | null>(null);
const [epOrderNo, setEpOrderNo] = useState<string | null>(null);
  const [bookingEvent, setBookingEvent] = useState<{ title: string; start: Date; end: Date } | null>(null);
  useEffect(() => {
    setSEO(
      "Payment Success | CoopMarket",
      "Your payment was successful. Thank you for supporting your community on CoopMarket."
    );

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");
        const bookingId = params.get("booking_id");
        if (!sessionId) {
          setVerifying(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        const oid = (data as any)?.order?.id ?? (data as any)?.order_id;
        if (oid) setOrderId(String(oid));

        // Capture shipping details from response
        const sm = (data as any)?.order?.shipping_method || null;
        const awb = (data as any)?.order?.easyparcel_awb_no || null;
        const epNo = (data as any)?.order?.easyparcel_order_no || null;
        setShippingMethod(sm);
        setAwbNo(awb);
        setEpOrderNo(epNo);

        // If this payment was for a service booking, mark it paid and build calendar event
        if (bookingId) {
          await supabase
            .from("service_bookings")
            .update({ status: "paid", stripe_session_id: sessionId })
            .eq("id", bookingId);

          const { data: bk, error: bErr } = await supabase
            .from("service_bookings")
            .select("id, service_id, scheduled_at, end_at, duration_minutes")
            .eq("id", bookingId)
            .maybeSingle();
          if (!bErr && bk && bk.scheduled_at) {
            // Fetch service name
            const { data: svc } = await supabase
              .from("vendor_services")
              .select("name")
              .eq("id", (bk as any).service_id)
              .maybeSingle();
            const start = new Date(bk.scheduled_at as string);
            const end = new Date((bk.end_at as string) || start.getTime() + ((bk.duration_minutes || 60) * 60 * 1000));
            setBookingEvent({
              title: `Service: ${svc?.name || 'Booking'}`,
              start,
              end,
            });
          }
        }
        toast("Payment verified", { description: sm === 'easyparcel' ? "Shipment will be handled by courier." : "Your transaction has been confirmed. Rider assignment will follow shortly." });
        clear();
      } catch (e: any) {
        toast("Verification issue", { description: e.message || String(e) });
      } finally {
        setVerifying(false);
      }
    };

    run();
  }, []);

  // Watch for the created order and subscribe to delivery updates
  useEffect(() => {
    if (!orderId || shippingMethod !== 'rider') return;

    let deliveryChannel: ReturnType<typeof supabase.channel> | null = null;
    let assignmentChannel: ReturnType<typeof supabase.channel> | null = null;

    const fetchDelivery = async () => {
      const { data: del } = await supabase
        .from("deliveries")
        .select("id,status,rider_user_id")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (del) {
        setDeliveryId(del.id);
        setDeliveryStatus(del.status);
        setRiderUserId(del.rider_user_id);
        if (del.rider_user_id) {
          toast("Rider assigned", { description: "Your rider is on the way." });
        }
      }
    };

    fetchDelivery();

    // Subscribe to delivery row creation/updates
    deliveryChannel = supabase
      .channel("delivery-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deliveries", filter: `order_id=eq.${orderId}` },
        (payload: any) => {
          const del = payload.new;
          setDeliveryId(del.id);
          setDeliveryStatus(del.status);
          setRiderUserId(del.rider_user_id);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deliveries", filter: `order_id=eq.${orderId}` },
        (payload: any) => {
          const del = payload.new;
          setDeliveryId(del.id);
          setDeliveryStatus(del.status);
          setRiderUserId(del.rider_user_id);
          if (del.rider_user_id) {
            toast("Rider assigned", { description: "Your rider is on the way." });
          }
        }
      )
      .subscribe();

    const setupAssignmentChannel = (did: string) => {
      assignmentChannel = supabase
        .channel("assignment-updates")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "delivery_assignments", filter: `delivery_id=eq.${did}` },
          () => toast("Delivery broadcasted", { description: "Nearby riders are being notified." })
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "delivery_assignments", filter: `delivery_id=eq.${did}` },
          () => toast("Rider responded", { description: "A rider responded to your delivery." })
        )
        .subscribe();
    };

    if (deliveryId) setupAssignmentChannel(deliveryId);

    return () => {
      if (deliveryChannel) supabase.removeChannel(deliveryChannel);
      if (assignmentChannel) supabase.removeChannel(assignmentChannel);
    };
  }, [orderId, deliveryId, shippingMethod]);

  // Auto-rebroadcast after ~2 minutes if still no rider
  useEffect(() => {
    if (shippingMethod !== 'rider' || !deliveryId || riderUserId) return;
    if (rebroadcastTimer.current) window.clearTimeout(rebroadcastTimer.current);
    rebroadcastTimer.current = window.setTimeout(async () => {
      try {
        setRebroadcasting(true);
        const { error } = await supabase.functions.invoke("rebroadcast-delivery", {
          body: { delivery_id: deliveryId },
        });
        if (error) throw error;
        toast("Searching riders again", { description: "We’re notifying more nearby riders." });
      } catch (e: any) {
        toast("Couldn’t rebroadcast", { description: e.message || String(e) });
      } finally {
        setRebroadcasting(false);
      }
    }, 125000);

    return () => {
      if (rebroadcastTimer.current) window.clearTimeout(rebroadcastTimer.current);
    };
  }, [deliveryId, riderUserId, shippingMethod]);

  const manualRebroadcast = async () => {
    if (!deliveryId) return;
    try {
      setRebroadcasting(true);
      const { error } = await supabase.functions.invoke("rebroadcast-delivery", {
        body: { delivery_id: deliveryId },
      });
      if (error) throw error;
      toast("Rebroadcasted", { description: "We’re notifying nearby riders again." });
    } catch (e: any) {
      toast("Couldn’t rebroadcast", { description: e.message || String(e) });
    } finally {
      setRebroadcasting(false);
    }
  };

  return (
    <main className="container py-16">
      <h1 className="text-3xl font-semibold">Payment successful</h1>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
{verifying ? (
            <div className="space-y-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                <span className="font-medium">Finalizing your order…</span>
              </div>
              <Skeleton className="h-24 w-full" />
              <p className="text-sm text-muted-foreground">This usually takes a few seconds. Please don’t close the window.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                Your transaction completed successfully{orderId ? ` (Order #${orderId})` : "."}
              </div>
              {shippingMethod === 'easyparcel' ? (
                <div>
                  {awbNo ? (
                    <div>
                      Shipment booked via EasyParcel — AWB <span className="font-medium">{awbNo}</span>
                    </div>
                  ) : (
                    <div>Shipment pending: waiting for courier booking or address completion.</div>
                  )}
                </div>
              ) : deliveryStatus ? (
                <div>
                  Delivery status: <span className="font-medium">{deliveryStatus}</span>
                  {riderUserId ? " — rider assigned" : " — searching for nearby riders"}
                </div>
              ) : (
                <div>Setting up your delivery and notifying nearby riders…</div>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <a href="/">Go to homepage</a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/orders">View my orders</a>
            </Button>
            {shippingMethod === 'easyparcel' && awbNo && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await trackEasyParcel({ awb_no: awbNo });
                    const status = (res as any)?.data?.[0]?.status || (res as any)?.result?.[0]?.status || "Status retrieved";
                    toast("Tracking update", { description: String(status) });
                  } catch (e: any) {
                    toast("Tracking error", { description: e.message || String(e) });
                  }
                }}
              >
                Track shipment
              </Button>
            )}
            {shippingMethod === 'rider' && !riderUserId && (
              <Button onClick={manualRebroadcast} disabled={!deliveryId || rebroadcasting} variant="outline">
                {rebroadcasting ? "Searching riders…" : "Find rider again"}
              </Button>
            )}
            {bookingEvent && (
              <>
                <Button asChild variant="outline">
                  <a
                    href={googleCalendarUrl({
                      title: bookingEvent.title,
                      description: 'Booked via CoopMarket',
                      start: bookingEvent.start,
                      end: bookingEvent.end,
                      url: window.location.origin + '/orders',
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Add to Google Calendar
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const ics = buildICS({
                      title: bookingEvent.title,
                      description: 'Booked via CoopMarket',
                      start: bookingEvent.start,
                      end: bookingEvent.end,
                      url: window.location.origin + '/orders',
                    });
                    downloadICS('service-booking.ics', ics);
                  }}
                >
                  Download .ics
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

