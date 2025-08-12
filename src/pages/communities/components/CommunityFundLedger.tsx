import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface LedgerRow {
  id: string;
  amount_cents: number;
  created_at: string;
  type: string;
  user_id: string | null;
  notes?: string | null;
}

export default function CommunityFundLedger({
  rows,
  onExport,
}: {
  rows: LedgerRow[];
  onExport: () => void;
}) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Fund Ledger</CardTitle>
            <CardDescription>Contributions and distributions</CardDescription>
          </div>
          <Button variant="outline" onClick={onExport}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount (RM)</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 20).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell className="text-right">{(r.amount_cents / 100).toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.user_id || ""}</TableCell>
                    <TableCell className="max-w-[18rem] truncate" title={r.notes || undefined}>{r.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
