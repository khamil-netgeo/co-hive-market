import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchEasyParcelRates } from "@/lib/shipping";
import { Truck, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShippingEstimatorProps {
  defaultPickPostcode?: string;
  defaultSendPostcode?: string;
  defaultWeightKg?: number; // kilograms
  productKind?: string;
  perishable?: boolean;
  allowEasyparcel?: boolean;
}

export default function ShippingEstimator({
  defaultPickPostcode = "",
  defaultSendPostcode = "",
  defaultWeightKg = 1,
  productKind,
  perishable,
  allowEasyparcel = true,
}: ShippingEstimatorProps) {
  const [pick, setPick] = useState(defaultPickPostcode);
  const [send, setSend] = useState(defaultSendPostcode);
  const [weight, setWeight] = useState<number>(defaultWeightKg);
  const [packageSize, setPackageSize] = useState<'S'|'M'|'L'>('M');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCheck = async () => {
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      // Map simple S/M/L to weight kg (dims optional for EP)
      const weightKg = packageSize === 'S' ? 0.5 : packageSize === 'M' ? 1 : 3;
      const res: any = await fetchEasyParcelRates({
        pick_postcode: pick,
        send_postcode: send,
        weight: weightKg,
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

  const isDeliveryOnly = productKind === 'prepared_food' || (productKind === 'grocery' && perishable) || !allowEasyparcel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          {isDeliveryOnly ? 'Local Delivery Only' : 'Shipping Options'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isDeliveryOnly && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {productKind === 'prepared_food' 
                ? 'Fresh prepared food is delivered by local riders within your community for optimal quality and temperature.'
                : 'Fresh perishable items require local delivery to maintain quality and safety.'
              }
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Pickup postcode" value={pick} onChange={(e) => setPick(e.target.value)} />
          <Input placeholder="Delivery postcode" value={send} onChange={(e) => setSend(e.target.value)} />
          <div>
            <Select value={packageSize} onValueChange={(v) => setPackageSize(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Package size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Small — up to 0.5 kg</SelectItem>
                <SelectItem value="M">Medium — up to 1 kg</SelectItem>
                <SelectItem value="L">Large — up to 3 kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {!isDeliveryOnly && (
          <Button onClick={onCheck} disabled={loading || !pick || !send}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...
              </>
            ) : (
              "Check rates"
            )}
          </Button>
        )}

        {error && !isDeliveryOnly && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {!isDeliveryOnly && Array.isArray(results) && results.length > 0 && (
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

        {isDeliveryOnly && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Local Rider Delivery</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Delivered within 30-60 minutes</p>
              <p>• Service radius: 10km from pickup location</p>
              <p>• {productKind === 'prepared_food' ? 'Temperature controlled for hot food' : 'Refrigerated transport available'}</p>
              <p>• Real-time tracking via your community riders</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
