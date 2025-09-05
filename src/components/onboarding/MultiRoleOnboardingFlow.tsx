import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Store, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Users,
  TrendingUp
} from "lucide-react";

interface MultiRoleOnboardingFlowProps {
  onRoleSelect: (roles: ('buyer' | 'vendor' | 'delivery')[]) => void;
  selectedCommunity?: string;
}

const roleConfig = {
  buyer: {
    icon: ShoppingCart,
    label: "Buyer",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Browse and purchase from local vendors",
    benefits: [
      "Access to exclusive member discounts",
      "Priority customer support", 
      "Early access to new products",
      "Community member perks"
    ],
    setupTime: "2 minutes",
    difficulty: "Easy"
  },
  vendor: {
    icon: Store,
    label: "Vendor",
    color: "text-green-600",
    bgColor: "bg-green-50", 
    borderColor: "border-green-200",
    description: "Sell your products and grow your business",
    benefits: [
      "Reach local customers directly",
      "Low transaction fees for members",
      "Built-in delivery network",
      "Analytics and insights"
    ],
    setupTime: "10 minutes",
    difficulty: "Medium"
  },
  delivery: {
    icon: Truck,
    label: "Rider",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200", 
    description: "Deliver orders and earn flexible income",
    benefits: [
      "Flexible working hours",
      "Competitive delivery rates",
      "Weekly payouts available",
      "Community support network"
    ],
    setupTime: "15 minutes", 
    difficulty: "Medium"
  }
};

const multiRoleBenefits = [
  {
    icon: Sparkles,
    title: "Enhanced Experience",
    description: "Multiple perspectives give you better insights into the platform"
  },
  {
    icon: TrendingUp, 
    title: "Additional Income",
    description: "Vendor + Rider roles can create multiple revenue streams"
  },
  {
    icon: Users,
    title: "Community Impact", 
    description: "Active multi-role members strengthen the entire ecosystem"
  }
];

export default function MultiRoleOnboardingFlow({ 
  onRoleSelect, 
  selectedCommunity 
}: MultiRoleOnboardingFlowProps) {
  const [selectedRoles, setSelectedRoles] = useState<('buyer' | 'vendor' | 'delivery')[]>(['buyer']);
  const [step, setStep] = useState<'select' | 'benefits' | 'confirm'>('select');

  const toggleRole = (roleKey: string) => {
    const typedRoleKey = roleKey as 'buyer' | 'vendor' | 'delivery';
    setSelectedRoles(prev => {
      if (roleKey === 'buyer') return prev; // Buyer is always required
      return prev.includes(typedRoleKey) 
        ? prev.filter(r => r !== typedRoleKey)
        : [...prev, typedRoleKey];
    });
  };

  const handleContinue = () => {
    if (step === 'select') {
      if (selectedRoles.length > 1) {
        setStep('benefits');
      } else {
        setStep('confirm');
      }
    } else if (step === 'benefits') {
      setStep('confirm');
    } else {
      onRoleSelect(selectedRoles);
    }
  };

  const totalSetupTime = selectedRoles.reduce((total, roleKey) => {
    const time = parseInt(roleConfig[roleKey as keyof typeof roleConfig]?.setupTime || '0');
    return total + time;
  }, 0);

  if (step === 'benefits') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Great Choice! 🎉</h2>
          <p className="text-muted-foreground">
            Having multiple roles unlocks additional benefits
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {multiRoleBenefits.map((benefit, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex p-3 rounded-full bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Multi-Role Bonus</h3>
                <p className="text-sm text-muted-foreground">
                  Members with 2+ roles get priority support and exclusive features
                </p>
              </div>
              <Badge variant="secondary">Bonus</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('select')}>
            Back to Selection
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue Setup
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground">
            Review your selected roles and estimated setup time
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Your Selected Roles
              <Badge variant="secondary">{selectedRoles.length} roles</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRoles.map(roleKey => {
              const config = roleConfig[roleKey as keyof typeof roleConfig];
              const Icon = config.icon;
              
              return (
                <div key={roleKey} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-sm text-muted-foreground">
                      Setup time: {config.setupTime} • {config.difficulty}
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold">Total Setup Time</div>
                <div className="text-sm text-muted-foreground">Estimated completion time</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalSetupTime}min</div>
                <div className="text-sm text-muted-foreground">You can always complete later</div>
              </div>
            </div>
            <Progress value={0} className="h-2" />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('select')}>
            Modify Selection
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Start Setup Process
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Roles</h2>
        <p className="text-muted-foreground">
          Select how you'd like to participate in the community
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(roleConfig).map(([roleKey, config]) => {
          const typedRoleKey = roleKey as 'buyer' | 'vendor' | 'delivery';
          const isSelected = selectedRoles.includes(typedRoleKey);
          const isRequired = roleKey === 'buyer';
          const Icon = config.icon;
          
          return (
            <Card
              key={roleKey}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? `${config.borderColor} border-2 ${config.bgColor}` 
                  : 'hover:border-primary/50'
              } ${isRequired ? 'opacity-100' : ''}`}
              onClick={() => !isRequired && toggleRole(typedRoleKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {isRequired && <Badge variant="secondary" className="text-xs">Required</Badge>}
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
                
                <Separator />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Setup: {config.setupTime}</span>
                  <span>{config.difficulty}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedRoles.length > 1 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">Multi-Role Benefits Available!</div>
                <div className="text-sm text-muted-foreground">
                  You'll unlock additional features with {selectedRoles.length} roles
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleContinue} className="w-full" disabled={selectedRoles.length === 0}>
        Continue with {selectedRoles.length} Role{selectedRoles.length !== 1 ? 's' : ''}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}