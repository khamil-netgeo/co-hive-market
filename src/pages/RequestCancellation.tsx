import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function RequestCancellation() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [currency, setCurrency] = useState<string>("usd");
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    setSEOAdvanced({
      title: "Request Cancellation — CoopMarket",
      description: "Ask to cancel an order that hasn’t shipped yet.",
      type: "article",
      canonical: window.location.href,
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) { navigate("/auth"); return; }
        if (!orderId) return;
        const { data: order, error } = await supabase
          .from("orders")
          .select("id, currency, vendor_id, status, buyer_user_id")
          .eq("id", orderId)
          .maybeSingle();
        if (error) throw error;
        if (!order) throw new Error("Order not found");
        if ((order as any).buyer_user_id !== session.session.user.id) {
          toast("Access denied", { description: "You can only cancel your own orders." });
          navigate("/orders");
          return;
        }
        setCurrency((order as any).currency || "usd");
        setVendorId((order as any).vendor_id || null);
      } catch (e: any) {
        toast("Unable to load order", { description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId, navigate]);

  const onSubmit = async () => {
    try {
      if (!orderId || !vendorId) return;
      setSubmitting(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { navigate("/auth"); return; }
      const { error } = await supabase.from("order_cancel_requests").insert({
        order_id: orderId,
        buyer_user_id: auth.user.id,
        vendor_id: vendorId,
        reason: reason || null,
        currency,
      } as any);
      if (error) throw error;
      toast.success("Cancellation requested", { description: "We’ll notify the seller and update you shortly." });
      navigate(`/orders/${orderId}`);
    } catch (e: any) {
      toast("Submission failed", { description: e.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Request a Cancellation</h1>
        <p className="text-sm text-muted-foreground">If your order hasn’t shipped, you can ask to cancel it.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              placeholder="Tell us why you’d like to cancel (ordered by mistake, duplicate, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={5}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate(orderId ? `/orders/${orderId}` : "/orders")}>Back</Button>
            <Button onClick={onSubmit} disabled={loading || submitting} className="ml-auto">Submit request</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
