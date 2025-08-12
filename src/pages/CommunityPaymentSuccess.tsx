import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CommunityPaymentSuccess() {
  const [search] = useSearchParams();
  const sessionId = search.get("session_id");
  const communityId = search.get("community_id");
  const purpose = search.get("purpose") || "contribution";
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    setSEO("Payment Success", "Your payment was processed successfully.");
  }, []);

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("community-payment-confirm", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        if (data?.status === 'recorded' || data?.status === 'not_paid') {
          setStatus("ok");
          toast.success("Payment recorded");
        } else {
          setStatus("error");
        }
      } catch (err: any) {
        setStatus("error");
        toast("Confirmation failed", { description: err?.message || String(err) });
      }
    };
    confirm();
  }, [sessionId]);

  return (
    <main className="container py-8">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Payment {status === 'pending' ? 'Processing…' : status === 'ok' ? 'Successful' : 'Error'}</CardTitle>
          <CardDescription>
            {status === 'pending' && 'Confirming your payment with Stripe…'}
            {status === 'ok' && (purpose === 'membership' ? 'Your membership payment is recorded.' : 'Your contribution is recorded.')}
            {status === 'error' && 'We could not confirm this payment. Please contact support if you were charged.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {communityId ? (
            <Button asChild>
              <Link to={`/communities/${communityId}`}>Back to Community</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/communities">Browse Communities</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
