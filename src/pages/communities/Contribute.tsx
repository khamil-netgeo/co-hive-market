import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Contribute() {
  const { id } = useParams();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSEO("Contribute to Community", "Support your cooperative community with a secure contribution.");
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("community-contribute", {
        body: {
          community_id: id,
          amount_cents: Math.round(value * 100),
          purpose: "contribution",
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url as string, "_blank");
      } else {
        toast("Unable to start checkout");
      }
    } catch (err: any) {
      toast("Payment error", { description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Contribute to Community</h1>
        <p className="text-sm text-muted-foreground mt-1">Secure one-off contribution via Stripe Checkout.</p>
      </header>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Enter contribution amount</CardTitle>
          <CardDescription>All funds go to the selected community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm">Amount (MYR)</label>
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !amount}>
                {loading ? "Starting checkout…" : "Proceed to Checkout"}
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/communities/${id}`}>Back</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
