import { ShieldCheck, Truck, BadgeCheck } from "lucide-react";

export default function ProductTrustBadges() {
  const itemCls = "flex items-center gap-2 text-sm text-muted-foreground";
  const iconCls = "h-4 w-4 text-primary";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border rounded-lg p-4 bg-card">
      <div className={itemCls}>
        <ShieldCheck className={iconCls} />
        <span>Secure checkout</span>
      </div>
      <div className={itemCls}>
        <Truck className={iconCls} />
        <span>Fast delivery options</span>
      </div>
      <div className={itemCls}>
        <BadgeCheck className={iconCls} />
        <span>Community-backed sellers</span>
      </div>
    </div>
  );
}
