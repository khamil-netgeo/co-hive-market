import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Store, Truck, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Role {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  recommended?: boolean;
}

interface MobileRoleSelectorProps {
  selectedRoles: string[];
  onRoleToggle: (roleId: string) => void;
  multiSelect?: boolean;
}

const roles: Role[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Shop from local vendors and get member discounts',
    icon: <ShoppingCart className="h-6 w-6" />,
    benefits: ['Member discounts', 'Local products', 'Community support'],
    recommended: true
  },
  {
    id: 'vendor',
    title: 'Vendor',
    description: 'Sell your products and services to the community',
    icon: <Store className="h-6 w-6" />,
    benefits: ['Sell products', 'Build customer base', 'Community presence']
  },
  {
    id: 'delivery',
    title: 'Delivery',
    description: 'Earn money by delivering orders to community members',
    icon: <Truck className="h-6 w-6" />,
    benefits: ['Flexible income', 'Choose your hours', 'Help community']
  }
];

export default function MobileRoleSelector({
  selectedRoles,
  onRoleToggle,
  multiSelect = false
}: MobileRoleSelectorProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Return desktop version - enhanced grid
    return (
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isSelected={selectedRoles.includes(role.id)}
            onSelect={() => onRoleToggle(role.id)}
            isMobile={false}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1">
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          isSelected={selectedRoles.includes(role.id)}
          onSelect={() => onRoleToggle(role.id)}
          isMobile={true}
        />
      ))}
      
      {multiSelect && selectedRoles.length > 0 && (
        <div className="mt-8 p-5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm">
          <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Selected Roles ({selectedRoles.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map((roleId) => {
              const role = roles.find(r => r.id === roleId);
              return role ? (
                <Badge key={roleId} variant="default" className="text-xs px-3 py-1 font-medium">
                  {role.title}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface RoleCardProps {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
  isMobile: boolean;
}

function RoleCard({ role, isSelected, onSelect, isMobile }: RoleCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 group relative overflow-hidden",
        isMobile 
          ? "p-5 active:scale-[0.97] shadow-sm hover:shadow-md min-h-[140px]" 
          : "p-8 hover:shadow-xl hover:-translate-y-1 min-h-[200px]",
        isSelected && "ring-2 ring-primary ring-offset-2 bg-gradient-to-br from-primary/8 to-primary/5 shadow-lg",
        role.recommended && !isSelected && "border-primary/40 bg-gradient-to-br from-primary/5 to-primary/2 shadow-md",
        !isSelected && !role.recommended && "hover:border-primary/20 hover:bg-primary/2"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4 h-full">
        {/* Icon */}
        <div className={cn(
          "rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300",
          isMobile ? "w-14 h-14" : "w-16 h-16",
          isSelected 
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg group-hover:scale-105" 
            : "bg-gradient-to-br from-primary/15 to-primary/10 text-primary group-hover:bg-primary/20"
        )}>
          {role.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "font-bold text-foreground",
                isMobile ? "text-lg leading-tight" : "text-xl"
              )}>
                {role.title}
              </h3>
              {role.recommended && (
                <Badge variant="secondary" className="text-xs font-semibold bg-gradient-to-r from-primary/15 to-primary/10 text-primary border-primary/20">
                  Popular
                </Badge>
              )}
            </div>
            {isSelected && (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 animate-in zoom-in-75 duration-200" />
            )}
          </div>
          
          <p className={cn(
            "text-muted-foreground leading-relaxed flex-grow",
            isMobile ? "text-sm mb-3" : "text-base mb-4"
          )}>
            {role.description}
          </p>

          {/* Benefits - enhanced styling */}
          <div className="mt-auto">
            <div className={cn(
              "flex gap-2",
              isMobile ? "flex-wrap" : "flex-wrap"
            )}>
              {role.benefits.slice(0, isMobile ? 3 : 3).map((benefit, index) => (
                <span 
                  key={index}
                  className={cn(
                    "text-xs px-3 py-1.5 bg-gradient-to-r from-muted to-muted/80 rounded-full text-muted-foreground font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                    isMobile ? "text-xs" : "text-xs"
                  )}
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </Card>
  );
}