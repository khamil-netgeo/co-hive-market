import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [verifying, setVerifying] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    setSEO(
      "Payment Success | CoopMarket",
      "Your payment was successful. Thank you for supporting your community on CoopMarket."
    );

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");
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
        toast("Payment verified", { description: "Your order has been created." });
      } catch (e: any) {
        toast("Verification issue", { description: e.message || String(e) });
      } finally {
        setVerifying(false);
      }
    };

    run();
  }, []);

  return (
    <main className="container py-16">
      <h1 className="text-3xl font-semibold">Payment successful</h1>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {verifying ? (
            <div>Finalizing your order…</div>
          ) : (
            <div>
              Your transaction completed successfully{orderId ? ` (Order #${orderId})` : "."} You can return to the
              homepage or continue browsing.
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <a href="/">Go to homepage</a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/orders">View my orders</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
