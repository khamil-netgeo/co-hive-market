import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchEasyParcelRates } from "@/lib/shipping";
import { Truck, Loader2 } from "lucide-react";

interface ShippingEstimatorProps {
  defaultPickPostcode?: string;
  defaultSendPostcode?: string;
  defaultWeightKg?: number; // kilograms
}

export default function ShippingEstimator({
  defaultPickPostcode = "",
  defaultSendPostcode = "",
  defaultWeightKg = 1,
}: ShippingEstimatorProps) {
  const [pick, setPick] = useState(defaultPickPostcode);
  const [send, setSend] = useState(defaultSendPostcode);
  const [weight, setWeight] = useState<number>(defaultWeightKg);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCheck = async () => {
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const res: any = await fetchEasyParcelRates({
        pick_postcode: pick,
        send_postcode: send,
        weight: weight || 1,
        pick_country: "MY",
        send_country: "MY",
        domestic: true,
      });
      const data = res?.data ?? [];
      // Normalize possible nested structures
      const list = Array.isArray(data) ? data : (Array.isArray(data?.[0]?.rates) ? data[0].rates : []);
      setResults(list);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Shipping estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Pickup postcode" value={pick} onChange={(e) => setPick(e.target.value)} />
          <Input placeholder="Delivery postcode" value={send} onChange={(e) => setSend(e.target.value)} />
          <Input
            placeholder="Weight (kg)"
            type="number"
            min={0.1}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
          />
        </div>
        <Button onClick={onCheck} disabled={loading || !pick || !send}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...
            </>
          ) : (
            "Check rates"
          )}
        </Button>

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {Array.isArray(results) && results.length > 0 && (
          <div className="space-y-2">
            {results.slice(0, 5).map((r, idx) => (
              <div key={idx} className="rounded border p-3 text-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{r?.courier_name || r?.courier_id || r?.service || "Courier"}</div>
                  {r?.etd && <div className="text-muted-foreground">ETA: {r.etd}</div>}
                </div>
                <div className="font-semibold">
                  {r?.price || r?.rate || r?.price_total || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
