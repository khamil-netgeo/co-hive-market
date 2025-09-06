import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store, Truck, CheckCircle2, ArrowRight, Plus } from "lucide-react";

interface SimpleRoleSelectorProps {
  onRoleSelect: (role: 'buyer' | 'vendor' | 'delivery') => void;
  onMultiRoleSelect: () => void;
  existingRoles: string[];
  loading: boolean;
}

const roleConfig = {
  buyer: {
    icon: ShoppingCart,
    label: "Buyer",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Shop from local vendors in your community",
    benefits: ["Member discounts", "Priority support", "Early access"],
    recommended: true
  },
  vendor: {
    icon: Store,
    label: "Vendor", 
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Sell products and grow your business",
    benefits: ["Reach local customers", "Low fees", "Analytics"],
    recommended: false
  },
  delivery: {
    icon: Truck,
    label: "Rider",
    color: "text-orange-600", 
    bgColor: "bg-orange-50",
    description: "Deliver orders and earn flexible income",
    benefits: ["Flexible hours", "Competitive rates", "Weekly payouts"],
    recommended: false
  }
};

export default function SimpleRoleSelector({ 
  onRoleSelect, 
  onMultiRoleSelect, 
  existingRoles, 
  loading 
}: SimpleRoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'vendor' | 'delivery'>('buyer');

  const handleRoleSelect = (role: 'buyer' | 'vendor' | 'delivery') => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    onRoleSelect(selectedRole);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Starting Role</h2>
        <p className="text-muted-foreground">
          You can always add more roles later from your profile
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(roleConfig).map(([roleKey, config]) => {
          const typedRoleKey = roleKey as 'buyer' | 'vendor' | 'delivery';
          const isSelected = selectedRole === typedRoleKey;
          const hasRole = existingRoles.includes(roleKey);
          const Icon = config.icon;
          
          return (
            <Card
              key={roleKey}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary border-2 ring-2 ring-primary/20' 
                  : 'hover:border-primary/50'
              } ${hasRole ? 'opacity-75' : ''}`}
              onClick={() => !hasRole && handleRoleSelect(typedRoleKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex gap-1">
                    {config.recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                    {hasRole && <Badge variant="outline" className="text-xs">✓ Joined</Badge>}
                    {isSelected && !hasRole && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-1">
                  {config.benefits.map((benefit, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={handleContinue} 
          className="w-full" 
          disabled={loading || existingRoles.includes(selectedRole)}
        >
          {loading ? "Joining..." : `Join as ${roleConfig[selectedRole].label}`}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onMultiRoleSelect}
          className="w-full"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Multiple Roles
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Start with one role and add others anytime from your profile settings
        </p>
      </div>
    </div>
  );
}