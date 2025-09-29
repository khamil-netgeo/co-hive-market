import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Users, 
  DollarSign, 
  MapPin, 
  TrendingUp,
  Star,
  Loader2,
  AlertCircle
} from "lucide-react";
import useUserRoles from "@/hooks/useUserRoles";
import MultiRoleOnboardingFlow from "./MultiRoleOnboardingFlow";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileOnboardingShell from "./MobileOnboardingShell";
import TouchOptimizedCommunityCard from "./TouchOptimizedCommunityCard";
import MobileRoleSelector from "./MobileRoleSelector";
import { RoleSelectionStep, CompletionStep } from "./StepComponents";

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  member_discount_percent: number;
}

interface OnboardingWizardProps {
  communities: Community[];
  onComplete: (communityId: string, roles: string[]) => void;
  onBack: () => void;
  userId?: string;
  autoSelectCommunity?: string;
  autoSelectRole?: string;
  loadingCommunities?: boolean;
}

const steps = [
  { title: "Welcome", description: "Get started with community marketplaces" },
  { title: "Choose Community", description: "Select a local community to join" },
  { title: "Select Role", description: "Choose how you want to participate" },
  { title: "Complete", description: "Finish setting up your account" }
];

export default function OnboardingWizard({
  communities,
  onComplete,
  onBack,
  userId,
  autoSelectCommunity,
  autoSelectRole,
  loadingCommunities = false
}: OnboardingWizardProps) {
  const { joinCommunity } = useUserRoles();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [recommendedCommunity, setRecommendedCommunity] = useState<Community | null>(null);
  const [singleRole, setSingleRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const {
    progress: onboardingProgress, 
    initializeProgress, 
    updateStep,
    updateCommunitySelection,
    updateRoleSelection,
    completeOnboarding,
    recordError
  } = useOnboardingProgress();

  // Initialize onboarding progress
  useEffect(() => {
    if (!onboardingProgress) {
      initializeProgress('wizard');
    }
  }, [onboardingProgress, initializeProgress]);

  // Restore wizard state from progress
  useEffect(() => {
    if (onboardingProgress) {
      setCurrentStep(onboardingProgress.currentStep);
      if (onboardingProgress.selectedCommunity) {
        const community = communities.find(c => c.id === onboardingProgress.selectedCommunity);
        if (community) {
          setSelectedCommunity(community);
        }
      }
    }
  }, [onboardingProgress, communities]);

  // Auto-select community and role if provided
  useEffect(() => {
    if (autoSelectCommunity && communities.length > 0) {
      const community = communities.find(c => c.id === autoSelectCommunity);
      if (community) {
        setSelectedCommunity(community);
        updateCommunitySelection(community.id);
      }
    }
    if (autoSelectRole) {
      setSingleRole(autoSelectRole);
      updateRoleSelection([autoSelectRole]);
    }
  }, [autoSelectCommunity, autoSelectRole, communities, updateCommunitySelection, updateRoleSelection]);

  // Set recommended community
  useEffect(() => {
    if (communities.length > 0 && !recommendedCommunity) {
      // Auto-select recommended community for faster onboarding
      const recommended = communities[0]; // Simple logic for now
      setRecommendedCommunity(recommended);
    }
  }, [communities, recommendedCommunity]);

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    setError(null);
    updateStep(currentStep + 1, true);

    if (currentStep === 2) {
      // Final step - complete onboarding
      if (!selectedCommunity || !singleRole) {
        recordError(currentStep, "Missing community or role selection");
        setError("Please select both a community and role");
        return;
      }

      setIsLoading(true);
      try {
        await joinCommunity(selectedCommunity.id, singleRole as 'buyer' | 'vendor' | 'delivery');
        await completeOnboarding([singleRole], selectedCommunity.id);
        
        // Move to completion step
        setCurrentStep(3);
        updateStep(3, true);
        
        // Auto-redirect after showing completion
        setTimeout(() => {
          onComplete(selectedCommunity.id, [singleRole]);
        }, 2000);
      } catch (error: any) {
        console.error('Error completing onboarding:', error);
        const errorMessage = error.message || "Failed to complete setup";
        recordError(currentStep, errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      updateStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    updateCommunitySelection(community.id);
    setError(null);
  };

  const stepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep onNext={handleNext} />
        );
      case 1:
        return (
          <CommunitySelectionStep 
            communities={communities}
            selectedCommunity={selectedCommunity}
            recommendedCommunity={recommendedCommunity}
            onCommunitySelect={handleCommunitySelect}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <RoleSelectionStep
            singleRole={singleRole}
            onRoleSelect={setSingleRole}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <CompletionStep 
            selectedCommunity={selectedCommunity}
            selectedRole={singleRole}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <MobileOnboardingShell
        currentStep={currentStep}
        totalSteps={steps.length}
        title={steps[currentStep].title}
        subtitle={steps[currentStep].description}
        onBack={currentStep > 0 ? handleBack : undefined}
        className="max-w-lg mx-auto"
      >
        {stepContent()}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}
      </MobileOnboardingShell>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Desktop Header - Enhanced */}
      <div className="text-center py-12 space-y-6">
        {/* Progress Steps - Enhanced */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-lg
                ${index <= currentStep 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/25' 
                  : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground shadow-muted/25'
                }
              `}>
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-3 rounded-full transition-all duration-300 ${
                  index < currentStep ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">{steps[currentStep].title}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>
        
        <div className="max-w-lg mx-auto space-y-2">
          <Progress value={progressPercentage} className="h-3 bg-muted/50" />
          <p className="text-sm text-muted-foreground font-medium">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Desktop Step Content - Enhanced */}
      <div className="min-h-[500px] pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {stepContent()}
        </div>

        {error && (
          <div className="mt-8 p-5 bg-destructive/10 border border-destructive/20 rounded-xl max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Desktop Navigation - Enhanced */}
        <div className="flex justify-between items-center max-w-4xl mx-auto mt-12 px-6">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            className="px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground font-medium bg-muted/50 px-4 py-2 rounded-full">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <div className="w-24" /> {/* Spacer */}
        </div>
      </div>
    </div>
  );
}

// Individual Step Components
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Users className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Welcome to Community Marketplaces</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Join a local community where members buy, sell, and deliver products and services to each other. 
            Get member discounts and support your local economy.
          </p>
        </div>

        <div className="grid gap-4 mt-8">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Member Discounts</div>
              <div className="text-xs text-muted-foreground">Save on every purchase</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Local Focus</div>
              <div className="text-xs text-muted-foreground">Support local businesses</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Earn Income</div>
              <div className="text-xs text-muted-foreground">Sell or deliver for others</div>
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full mt-8" size="lg">
          Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-8 pb-8 text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Users className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to Community Marketplaces</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Join a local community where members buy, sell, and deliver products and services to each other. 
            Get member discounts and support your local economy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium">Member Discounts</div>
            <div className="text-xs text-muted-foreground">Save on every purchase</div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm font-medium">Local Focus</div>
            <div className="text-xs text-muted-foreground">Support local businesses</div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-sm font-medium">Earn Income</div>
            <div className="text-xs text-muted-foreground">Sell or deliver</div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full max-w-xs mx-auto">
          Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function CommunitySelectionStep({ 
  communities, 
  selectedCommunity, 
  recommendedCommunity,
  onCommunitySelect,
  onNext,
  onBack,
  isLoading 
}: {
  communities: Community[];
  selectedCommunity: Community | null;
  recommendedCommunity: Community | null;
  onCommunitySelect: (community: Community) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {recommendedCommunity && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Recommended for You</span>
            </div>
            <TouchOptimizedCommunityCard
              community={recommendedCommunity}
              isSelected={selectedCommunity?.id === recommendedCommunity.id}
              isRecommended={true}
              onSelect={() => onCommunitySelect(recommendedCommunity)}
              showJoinButton={true}
            />
          </div>
        )}

        {communities.filter(c => c.id !== recommendedCommunity?.id).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Other Communities
            </h3>
            <div className="space-y-3">
              {communities
                .filter(c => c.id !== recommendedCommunity?.id)
                .map((community) => (
                  <TouchOptimizedCommunityCard
                    key={community.id}
                    community={community}
                    isSelected={selectedCommunity?.id === community.id}
                    onSelect={() => onCommunitySelect(community)}
                    showJoinButton={true}
                  />
                ))}
            </div>
          </div>
        )}

        {selectedCommunity && (
          <Button 
            onClick={onNext} 
            disabled={isLoading}
            className="w-full mt-6"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Continue with {selectedCommunity.name}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {recommendedCommunity && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Recommended for You
              </CardTitle>
              <Badge variant="secondary">Best Match</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TouchOptimizedCommunityCard
              community={recommendedCommunity}
              isSelected={selectedCommunity?.id === recommendedCommunity.id}
              isRecommended={true}
              onSelect={() => onCommunitySelect(recommendedCommunity)}
            />
          </CardContent>
        </Card>
      )}

      {communities.filter(c => c.id !== recommendedCommunity?.id).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Other Communities</h3>
          <div className="grid gap-4">
            {communities
              .filter(c => c.id !== recommendedCommunity?.id)
              .map((community) => (
                <TouchOptimizedCommunityCard
                  key={community.id}
                  community={community}
                  isSelected={selectedCommunity?.id === community.id}
                  onSelect={() => onCommunitySelect(community)}
                />
              ))}
          </div>
        </div>
      )}

      {selectedCommunity && (
        <div className="flex justify-center">
          <Button 
            onClick={onNext} 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Continue with {selectedCommunity.name}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}