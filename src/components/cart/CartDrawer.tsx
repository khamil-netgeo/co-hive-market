import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const cart = useCart();
  const navigate = useNavigate();

  const fmt = (cents: number, code: string | null) => {
    const cur = (code || "MYR").toUpperCase();
    return new Intl.NumberFormat(cur === "MYR" ? "ms-MY" : "en-US", { style: "currency", currency: cur }).format(cents / 100);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Your cart</DrawerTitle>
          <DrawerDescription>Review your items before checkout.</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          ) : (
            cart.items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-3 border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{fmt(item.price_cents, item.currency)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cart.updateQty(item.product_id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-8 text-center tabular-nums">{item.quantity}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cart.updateQty(item.product_id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cart.remove(item.product_id)}
                  aria-label="Remove item"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DrawerFooter>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{fmt(cart.subtotal_cents, cart.currency)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                navigate("/checkout");
              }}
              disabled={cart.items.length === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Go to checkout
            </Button>
            <Button variant="outline" onClick={() => cart.clear()} disabled={cart.items.length === 0}>
              Clear
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
