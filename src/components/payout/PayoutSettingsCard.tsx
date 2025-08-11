import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePayoutProfile, UserPayoutProfile, PayoutMethod } from "@/hooks/usePayoutProfile";

export default function PayoutSettingsCard({ title = "Payout Settings" }: { title?: string }) {
  const { profile, loading, saving, save } = usePayoutProfile();
  const [local, setLocal] = useState<UserPayoutProfile | null>(null);

  const current = useMemo(() => local ?? profile, [local, profile]);

  const onChange = (patch: Partial<UserPayoutProfile>) => {
    setLocal({ ...(current || ({} as any)), ...patch } as UserPayoutProfile);
  };

  const onSave = async () => {
    try {
      if (!current) return;
      // Basic validation
      if (current.method === "bank_transfer") {
        if (!current.bank_account_number || !current.bank_account_name) {
          toast("Missing bank details", { description: "Please provide account number and name." });
          return;
        }
      }
      if (current.method === "ewallet") {
        if (!current.ewallet_provider || !current.ewallet_id) {
          toast("Missing wallet details", { description: "Please provide provider and wallet ID." });
          return;
        }
      }
      await save(current);
      toast.success("Payout details saved");
      setLocal(null);
    } catch (e: any) {
      toast.error("Failed to save", { description: e.message || String(e) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Loading payout details…</div>}
        {!loading && (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={(current?.method as PayoutMethod) || "bank_transfer"} onValueChange={(v) => onChange({ method: v as PayoutMethod })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="ewallet">E‑Wallet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {current?.method === "bank_transfer" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bank name</Label>
                  <Input value={current?.bank_name || ""} onChange={(e) => onChange({ bank_name: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Account number</Label>
                  <Input value={current?.bank_account_number || ""} onChange={(e) => onChange({ bank_account_number: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Account holder name</Label>
                  <Input value={current?.bank_account_name || ""} onChange={(e) => onChange({ bank_account_name: e.target.value })} className="h-11" />
                </div>
              </div>
            )}

            {current?.method === "ewallet" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input value={current?.ewallet_provider || ""} onChange={(e) => onChange({ ewallet_provider: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Wallet ID / Phone</Label>
                  <Input value={current?.ewallet_id || ""} onChange={(e) => onChange({ ewallet_id: e.target.value })} className="h-11" />
                </div>
              </div>
            )}

            {current?.method === "other" && (
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Input value={current?.notes || ""} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Describe how to pay you" className="h-11" />
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={onSave} disabled={saving} className="min-w-28">{saving ? "Saving…" : "Save"}</Button>
              {local && (
                <Button variant="outline" onClick={() => setLocal(null)}>Cancel</Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
