import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "./CartDrawer";

export default function MiniCartButton() {
  const { count, subtotal_cents, currency } = useCart();
  const [open, setOpen] = useState(false);

  const fmt = (cents: number, code: string | null) => {
    const cur = (code || "MYR").toUpperCase();
    return new Intl.NumberFormat(cur === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: cur }).format(cents / 100);
  };

  if (count === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <Button
          onClick={() => setOpen(true)}
          className="shadow-elegant"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {count} • {fmt(subtotal_cents, currency)}
        </Button>
      </div>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
