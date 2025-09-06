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
    // Return desktop version - simplified grid
    return (
      <div className="grid md:grid-cols-3 gap-4">
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
    <div className="space-y-3">
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
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm font-medium text-primary mb-2">
            Selected Roles ({selectedRoles.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map((roleId) => {
              const role = roles.find(r => r.id === roleId);
              return role ? (
                <Badge key={roleId} variant="default" className="text-xs">
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
        "cursor-pointer transition-all duration-200",
        isMobile ? "p-4 active:scale-[0.98]" : "p-6 hover:shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        role.recommended && !isSelected && "border-primary/30 bg-primary/2"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "rounded-lg flex items-center justify-center flex-shrink-0",
          isMobile ? "w-12 h-12" : "w-14 h-14",
          isSelected 
            ? "bg-primary text-primary-foreground" 
            : "bg-primary/10 text-primary"
        )}>
          {role.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={cn(
              "font-semibold",
              isMobile ? "text-base" : "text-lg"
            )}>
              {role.title}
            </h3>
            {role.recommended && (
              <Badge variant="secondary" className="text-xs">
                Popular
              </Badge>
            )}
            {isSelected && (
              <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
            )}
          </div>
          
          <p className={cn(
            "text-muted-foreground leading-relaxed",
            isMobile ? "text-sm line-clamp-2" : "text-sm"
          )}>
            {role.description}
          </p>

          {/* Benefits - more compact on mobile */}
          <div className="mt-3">
            <div className={cn(
              "flex gap-1",
              isMobile ? "flex-col space-y-1" : "flex-wrap"
            )}>
              {role.benefits.slice(0, isMobile ? 2 : 3).map((benefit, index) => (
                <span 
                  key={index}
                  className={cn(
                    "text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground",
                    isMobile && "text-xs"
                  )}
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}