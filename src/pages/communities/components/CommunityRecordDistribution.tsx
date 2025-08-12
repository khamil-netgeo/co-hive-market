import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  distAmount: string;
  setDistAmount: (v: string) => void;
  distNotes: string;
  setDistNotes: (v: string) => void;
  distLoading: boolean;
  onSubmit: () => void;
  netFundRm: number;
}

export default function CommunityRecordDistribution({
  distAmount,
  setDistAmount,
  distNotes,
  setDistNotes,
  distLoading,
  onSubmit,
  netFundRm,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Distribution</CardTitle>
        <CardDescription>Deduct funds for grants or community expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="dist-amount">Amount (RM)</Label>
          <Input
            id="dist-amount"
            type="number"
            min={1}
            step={1}
            value={distAmount}
            onChange={(e) => setDistAmount(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          {(() => {
            const n = parseFloat(distAmount || '0') || 0;
            if (!distAmount) return null;
            if (n <= 0) return <p className="text-xs text-destructive">Enter an amount greater than 0</p>;
            if (n > netFundRm) return <p className="text-xs text-destructive">Amount exceeds available net fund</p>;
            return null;
          })()}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dist-notes">Notes</Label>
          <Textarea
            id="dist-notes"
            rows={3}
            value={distNotes}
            onChange={(e) => setDistNotes(e.target.value)}
            placeholder="Purpose / recipient / reference"
          />
          {distNotes.trim().length === 0 && (
            <p className="text-xs text-muted-foreground">Please add a short note for transparency.</p>
          )}
        </div>
        <Button
          onClick={onSubmit}
          disabled={(() => {
            const n = parseFloat(distAmount || '0') || 0;
            return (
              distLoading || !distAmount || n <= 0 || n > netFundRm || distNotes.trim().length === 0
            );
          })()}
        >
          {distLoading ? "Recording…" : "Record Distribution"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Net fund available: RM {netFundRm.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
