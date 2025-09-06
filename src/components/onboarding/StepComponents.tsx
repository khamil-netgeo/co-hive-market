import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileRoleSelector from './MobileRoleSelector';

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  member_discount_percent: number;
}

interface RoleSelectionStepProps {
  singleRole: string;
  onRoleSelect: (role: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function RoleSelectionStep({ 
  singleRole, 
  onRoleSelect, 
  onNext, 
  onBack, 
  isLoading 
}: RoleSelectionStepProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Choose Your Role</h2>
          <p className="text-sm text-muted-foreground">
            Select how you'd like to participate in the community
          </p>
        </div>

        <MobileRoleSelector
          selectedRoles={singleRole ? [singleRole] : []}
          onRoleToggle={(roleId) => {
            onRoleSelect(singleRole === roleId ? '' : roleId);
          }}
          multiSelect={false}
        />

        {singleRole && (
          <Button 
            onClick={onNext} 
            disabled={isLoading}
            className="w-full mt-6"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Continue as {singleRole}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Your Role</h2>
        <p className="text-muted-foreground">
          Select how you'd like to participate in the community
        </p>
      </div>

      <MobileRoleSelector
        selectedRoles={singleRole ? [singleRole] : []}
        onRoleToggle={(roleId) => {
          onRoleSelect(singleRole === roleId ? '' : roleId);
        }}
        multiSelect={false}
      />

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        
        <Button 
          onClick={onNext} 
          disabled={!singleRole || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface CompletionStepProps {
  selectedCommunity: Community | null;
  selectedRole: string;
  isLoading: boolean;
}

export function CompletionStep({ 
  selectedCommunity, 
  selectedRole, 
  isLoading 
}: CompletionStepProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Welcome to the Community!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You've successfully joined <strong>{selectedCommunity?.name}</strong> as a{' '}
            <strong>{selectedRole}</strong>. You'll be redirected to your dashboard in a moment.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Community:</span>
            <Badge variant="secondary">{selectedCommunity?.name}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Role:</span>
            <Badge variant="default">{selectedRole}</Badge>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your account...
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="pt-8 pb-8 text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to the Community!</h2>
          <p className="text-muted-foreground">
            You've successfully joined <strong>{selectedCommunity?.name}</strong> as a{' '}
            <strong>{selectedRole}</strong>. You'll be redirected to your dashboard in a moment.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Community:</span>
            <Badge variant="secondary">{selectedCommunity?.name}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role:</span>
            <Badge variant="default">{selectedRole}</Badge>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your account...
          </div>
        )}
      </CardContent>
    </Card>
  );
}