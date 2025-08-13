import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setSEOAdvanced } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function RequestReturn() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState<string>("refund");
  const [currency, setCurrency] = useState<string>("usd");
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    setSEOAdvanced({
      title: "Request Return — CoopMarket",
      description: "Submit a return request for your recent order.",
      type: "article",
      url: window.location.href,
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          navigate("/auth");
          return;
        }
        if (!orderId) return;
        const { data: order, error } = await supabase
          .from("orders")
          .select("id, currency, vendor_id, status, buyer_user_id")
          .eq("id", orderId)
          .maybeSingle();
        if (error) throw error;
        if (!order) throw new Error("Order not found");
        // Basic guard: ensure this is the buyer's order
        if ((order as any).buyer_user_id !== session.session.user.id) {
          toast("Access denied", { description: "You can only return your own orders." });
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
      if (!auth.user) {
        navigate("/auth");
        return;
      }
      const { error } = await (supabase as any).from("order_return_requests").insert({
        order_id: orderId,
        buyer_user_id: auth.user.id,
        vendor_id: vendorId,
        reason: reason || null,
        preferred_resolution: resolution,
        currency,
      } as any);
      if (error) throw error;
      toast.success("Return requested", { description: "We’ve notified the seller. You’ll get updates by email." });
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
        <h1 className="text-2xl font-semibold">Request a Return</h1>
        <p className="text-sm text-muted-foreground">Tell us what went wrong and how you’d like it resolved.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Return details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred resolution</label>
            <Select value={resolution} onValueChange={setResolution} disabled={loading || submitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
                <SelectItem value="store_credit">Store credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              placeholder="Describe the issue (quality, wrong item, damaged in transit, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading || submitting}
              rows={5}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate(orderId ? `/orders/${orderId}` : "/orders")} disabled={submitting}>Cancel</Button>
            <Button onClick={onSubmit} disabled={loading || submitting} className="ml-auto">Submit request</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
