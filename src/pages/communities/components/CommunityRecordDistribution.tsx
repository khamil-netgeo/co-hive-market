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
        </div>
        <Button onClick={onSubmit} disabled={distLoading || !distAmount}>
          {distLoading ? "Recording…" : "Record Distribution"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Net fund available: RM {netFundRm.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
