import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";

export default function PaymentCanceled() {
  useEffect(() => {
    setSEO(
      "Payment Canceled | CoopMarket",
      "Your payment was canceled. You can retry checkout anytime on CoopMarket."
    );
  }, []);

  return (
    <main className="container py-16">
      <h1 className="text-3xl font-semibold">Payment canceled</h1>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Payment canceled</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          No charge was made. If this was a mistake, you may start checkout again.
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <a href="/">Back to homepage</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
