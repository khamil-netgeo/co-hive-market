import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MediaGallery from "@/components/common/MediaGallery";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import { ShoppingCart, ArrowRight, Package, Briefcase, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

// Lightweight item type for quick view
type CatalogQuickViewItem = {
  id: string;
  type: "product" | "service";
  name: string;
  subtitle?: string | null;
  description?: string | null;
  price_cents: number;
  currency: string;
  image_urls?: string[] | null;
  video_url?: string | null;
  duration_minutes?: number | null;
  vendor_id: string;
};

function fmtPrice(cents: number, currency: string) {
  const amount = cents / 100;
  const code = currency?.toUpperCase?.() || "USD";
  return new Intl.NumberFormat(code === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: code }).format(amount);
}

export default function CatalogQuickView({
  open,
  onOpenChange,
  item,
  onAddToCart,
  discountedCents,
  discountPercent,
  distanceKm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogQuickViewItem | null;
  onAddToCart: (item: CatalogQuickViewItem) => void;
  discountedCents: number | null;
  discountPercent: number;
  distanceKm?: number | null;
}) {
  if (!item) return null;

  const priceBlock = (
    <div className="text-2xl font-semibold">
      {discountedCents != null && discountPercent > 0 ? (
        <div className="flex items-baseline gap-2">
          <span className="text-primary">{fmtPrice(discountedCents, item.currency)}</span>
          <span className="text-sm text-muted-foreground line-through">{fmtPrice(item.price_cents, item.currency)}</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary whitespace-nowrap">
            {discountPercent}% off
          </span>
        </div>
      ) : (
        <span>{fmtPrice(item.price_cents, item.currency)}</span>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.type === "product" ? (
              <Package className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            )}
            {item.name}
          </DialogTitle>
          {item.subtitle ? (
            <DialogDescription className="line-clamp-2">{item.subtitle}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <MediaGallery
              images={item.image_urls || []}
              videos={item.type === "product" && item.video_url ? [item.video_url] : []}
              alt={item.name}
              aspect="video"
              showThumbnails
            />
          </div>

          <div className="flex flex-col gap-3">
            <ReviewSummary targetType={item.type} targetId={item.id} />

            {priceBlock}

            {item.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>
            ) : null}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {item.type === "service" && typeof item.duration_minutes === "number" && item.duration_minutes > 0 ? (
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.duration_minutes} min</span>
              ) : null}
              {typeof distanceKm === "number" ? (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {distanceKm.toFixed(1)} km away</span>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-3">
              {item.type === "product" ? (
                <>
                  <Button
                    onClick={() => onAddToCart(item)}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to cart
                  </Button>
                  <Link to={`/${item.type}/${item.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      View details <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to={`/${item.type}/${item.id}`} className="w-full">
                  <Button className="w-full">View & book</Button>
                </Link>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
