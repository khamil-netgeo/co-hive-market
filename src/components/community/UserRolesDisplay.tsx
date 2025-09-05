import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface UserRolesDisplayProps {
  communityId: string;
  existingRoles: string[];
  onJoinRole: (role: 'buyer' | 'vendor' | 'delivery') => void;
  loading?: boolean;
}

const roleConfig = {
  buyer: { 
    label: "Buyer", 
    description: "Browse and purchase from vendors",
    variant: "secondary" as const
  },
  vendor: { 
    label: "Vendor", 
    description: "Sell products and manage your store",
    variant: "default" as const
  },
  delivery: { 
    label: "Rider", 
    description: "Deliver orders and earn money",
    variant: "outline" as const
  }
};

export default function UserRolesDisplay({ 
  communityId, 
  existingRoles, 
  onJoinRole, 
  loading 
}: UserRolesDisplayProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Object.entries(roleConfig).map(([roleKey, config]) => {
        const hasRole = existingRoles.includes(roleKey);
        const role = roleKey as 'buyer' | 'vendor' | 'delivery';
        
        return (
          <div 
            key={roleKey}
            className={`p-4 border rounded-lg transition-colors ${
              hasRole 
                ? 'bg-primary/5 border-primary/20' 
                : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground">{config.label}</h3>
              {hasRole && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Joined
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {config.description}
            </p>
            
            {!hasRole ? (
              <button
                onClick={() => onJoinRole(role)}
                disabled={loading}
                className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Joining..." : `Join as ${config.label}`}
              </button>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                You have this role
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}