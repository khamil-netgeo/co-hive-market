import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MediaGallery from "@/components/common/MediaGallery";

export type OrderCardProps = {
  orderId: string;
  createdAt: string;
  status: string;
  totalCents: number;
  currency: string;
  thumbnailUrl?: string;
  vendorId?: string | null;
  vendorName?: string | null;
  summaryTitle?: string | null;
  itemCount?: number;
  etaText?: string | null;
  onConfirm?: () => void;
};

const formatPrice = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase() || "USD",
  }).format((n || 0) / 100);

const statusVariant = (status: string): "default" | "secondary" | "destructive" => {
  const s = (status || "").toLowerCase();
  if (["canceled", "cancelled", "refunded", "returned"].includes(s)) return "destructive";
  if (["fulfilled", "completed"].includes(s)) return "default";
  return "secondary";
};

export default function OrderCard({
  orderId,
  createdAt,
  status,
  totalCents,
  currency,
  thumbnailUrl,
  vendorId,
  vendorName,
  summaryTitle,
  itemCount,
  etaText,
  onConfirm,
}: OrderCardProps) {
  return (
    <article className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium truncate" title={vendorName || "Vendor"}>
            {vendorName || "Vendor"}
          </span>
          <Badge variant={statusVariant(status)} className="ml-2 capitalize">
            {status}
          </Badge>
        </div>
        <time className="text-xs text-muted-foreground" dateTime={createdAt}>
          {new Date(createdAt).toLocaleString()}
        </time>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded">
            <MediaGallery
              images={thumbnailUrl ? [thumbnailUrl] : []}
              alt={`Order ${orderId.slice(0, 8)} thumbnail`}
              aspect="square"
              showThumbnails={false}
              className="h-16 w-16"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">
              {summaryTitle || `Order ${orderId.slice(0, 8)}`}
              {itemCount && itemCount > 1 ? ` · +${itemCount - 1} more` : ""}
            </h3>
            {etaText ? (
              <p className="mt-1 text-xs text-muted-foreground">{etaText}</p>
            ) : null}
            <p className="mt-1 text-sm font-medium">
              Total: {formatPrice(totalCents, currency)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button size="sm" variant="secondary" asChild>
            <a href={`/orders/${orderId}`}>Track</a>
          </Button>
          {vendorId ? (
            <Button size="sm" variant="outline" asChild>
              <a href={`/chat?vendorId=${vendorId}`}>Message seller</a>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" asChild>
            <a href={`/orders/${orderId}/cancel`}>Request Cancellation</a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`/orders/${orderId}/return`}>Request Return</a>
          </Button>
          {onConfirm ? (
            <Button size="sm" onClick={onConfirm}>
              Confirm Received
            </Button>
          ) : null}
        </div>
      </CardContent>
    </article>
  );
}
