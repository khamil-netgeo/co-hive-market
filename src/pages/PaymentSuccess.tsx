import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setSEO } from "@/lib/seo";

export default function PaymentSuccess() {
  useEffect(() => {
    setSEO(
      "Payment Success | CoopMarket",
      "Your payment was successful. Thank you for supporting your community on CoopMarket."
    );
  }, []);

  return (
    <main className="container py-16">
      <h1 className="text-3xl font-semibold">Payment successful</h1>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Your transaction completed successfully. You can return to the homepage or continue browsing.
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <a href="/">Go to homepage</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
