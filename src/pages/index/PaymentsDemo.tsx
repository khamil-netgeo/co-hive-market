import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentsDemo = () => {
  const [subStatus, setSubStatus] = useState<null | {
    subscribed: boolean;
    subscription_tier?: string | null;
    subscription_end?: string | null;
  }>(null);

  return (
    <section className="container py-12 md:py-16">
      <h2 className="text-3xl font-semibold">Payments & Subscriptions (MYR)</h2>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Try a one-off payment or start a subscription. Subscriptions require an account.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>One-off purchase</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>RM 49.90 — Demo product</p>
            <Button
              variant="hero"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("create-payment", {
                    body: {
                      name: "Demo Product",
                      amount_cents: 4990,
                      currency: "myr",
                      success_path: "/payment-success",
                      cancel_path: "/payment-canceled",
                    },
                  });
                  if (error) throw error;
                  window.open((data as any)?.url, "_blank");
                } catch (e: any) {
                  toast("Checkout error", { description: e.message || String(e) });
                }
              }}
            >
              Pay RM 49.90
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>RM 19.90 / month — Premium plan</p>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("create-checkout", {
                    body: {
                      name: "Premium Subscription",
                      amount_cents: 1990,
                      currency: "myr",
                      interval: "month",
                      success_path: "/payment-success",
                      cancel_path: "/payment-canceled",
                    },
                  });
                  if (error) throw error;
                  window.open((data as any)?.url, "_blank");
                } catch (e: any) {
                  toast("Subscription error", { description: e.message || String(e) });
                }
              }}
            >
              Subscribe RM 19.90/mo
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("customer-portal");
                  if (error) throw error;
                  window.open((data as any)?.url, "_blank");
                } catch (e: any) {
                  toast("Portal error", { description: e.message || String(e) });
                }
              }}
            >
              Manage subscription
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <Button
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("check-subscription");
                  if (error) throw error;
                  setSubStatus(data as any);
                  toast("Status updated", { description: JSON.stringify(data) });
                } catch (e: any) {
                  toast("Check failed", { description: e.message || String(e) });
                }
              }}
            >
              Refresh status
            </Button>
            <div className="rounded-md border bg-card p-3">
              {subStatus ? (
                <ul className="space-y-1 text-foreground">
                  <li>
                    <strong>Active:</strong> {subStatus.subscribed ? "Yes" : "No"}
                  </li>
                  {subStatus.subscription_tier && (
                    <li>
                      <strong>Tier:</strong> {subStatus.subscription_tier}
                    </li>
                  )}
                  {subStatus.subscription_end && (
                    <li>
                      <strong>Ends:</strong> {new Date(subStatus.subscription_end).toLocaleString()}
                    </li>
                  )}
                </ul>
              ) : (
                <p>No data yet. Use “Refresh status”.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PaymentsDemo;
