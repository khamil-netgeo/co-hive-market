import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MapPin, 
  Star, 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react";
import SimpleRoleSelector from "./SimpleRoleSelector";
import MultiRoleOnboardingFlow from "./MultiRoleOnboardingFlow";

interface Community {
  id: string;
  name: string;
  description: string;
  member_discount_percent: number;
  member_count?: number;
  is_active?: boolean;
  location?: string;
  created_at: string;
}

interface OnboardingWizardProps {
  communities: Community[];
  onJoinCommunity: (communityId: string, role: 'buyer' | 'vendor' | 'delivery') => void;
  onMultiRoleJoin: (communityId: string, roles: ('buyer' | 'vendor' | 'delivery')[]) => void;
  getUserRoles: (communityId: string) => string[];
  loading: boolean;
}

const steps = [
  { 
    id: 'welcome', 
    title: 'Welcome to CoopMarket', 
    description: 'Let\'s get you set up in a community marketplace'
  },
  { 
    id: 'community', 
    title: 'Choose Your Community', 
    description: 'Select the community marketplace you\'d like to join'
  },
  { 
    id: 'role', 
    title: 'Select Your Role', 
    description: 'Choose how you\'d like to participate'
  },
  { 
    id: 'complete', 
    title: 'All Set!', 
    description: 'Your account is ready to go'
  }
];

export default function OnboardingWizard({
  communities,
  onJoinCommunity,
  onMultiRoleJoin,
  getUserRoles,
  loading
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showMultiRole, setShowMultiRole] = useState(false);
  const [recommendedCommunity, setRecommendedCommunity] = useState<Community | null>(null);

  // Get recommended community based on activity and recency
  useEffect(() => {
    if (communities.length > 0) {
      // Sort by most recent and active communities
      const sorted = [...communities].sort((a, b) => {
        const scoreA = calculateCommunityScore(a);
        const scoreB = calculateCommunityScore(b);
        return scoreB - scoreA;
      });
      
      setRecommendedCommunity(sorted[0]);
      
      // Auto-select recommended community for faster onboarding
      if (!selectedCommunity) {
        setSelectedCommunity(sorted[0]);
      }
    }
  }, [communities, selectedCommunity]);

  const calculateCommunityScore = (community: Community) => {
    let score = 0;
    
    // Prefer newer communities (more likely to be active)
    const daysSinceCreated = (Date.now() - new Date(community.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 100 - daysSinceCreated); // Higher score for newer communities
    
    // Prefer communities with higher discounts
    score += community.member_discount_percent * 2;
    
    // Add bonus for having member counts if available
    if (community.member_count) {
      score += Math.min(community.member_count * 0.1, 50); // Cap bonus at 50
    }
    
    return score;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    handleNext();
  };

  const handleRoleSelect = (role: 'buyer' | 'vendor' | 'delivery') => {
    if (selectedCommunity) {
      onJoinCommunity(selectedCommunity.id, role);
    }
  };

  const handleMultiRoleSelect = (roles: ('buyer' | 'vendor' | 'delivery')[]) => {
    if (selectedCommunity) {
      onMultiRoleJoin(selectedCommunity.id, roles);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">{steps[currentStep].title}</h1>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
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

              <Button onClick={handleNext} className="w-full max-w-xs mx-auto">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
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
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{recommendedCommunity.name}</h3>
                      <p className="text-muted-foreground text-sm">{recommendedCommunity.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>{recommendedCommunity.member_discount_percent}% member discount</span>
                      </div>
                      {recommendedCommunity.member_count && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>{recommendedCommunity.member_count} members</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => handleCommunitySelect(recommendedCommunity)}
                      className="w-full"
                    >
                      Join {recommendedCommunity.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                {recommendedCommunity ? 'Or choose a different community:' : 'Choose your community:'}
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                {communities
                  .filter(c => c.id !== recommendedCommunity?.id)
                  .map((community) => (
                    <Card 
                      key={community.id} 
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedCommunity?.id === community.id ? 'border-primary ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => setSelectedCommunity(community)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{community.name}</CardTitle>
                          <Badge variant="outline">
                            {community.member_discount_percent}% off
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {community.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant={selectedCommunity?.id === community.id ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommunitySelect(community);
                          }}
                          className="w-full"
                        >
                          {selectedCommunity?.id === community.id ? "Selected" : "Select"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && selectedCommunity && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Joining: {selectedCommunity.name}
                </CardTitle>
                <CardDescription>
                  You'll get {selectedCommunity.member_discount_percent}% member discount on all purchases
                </CardDescription>
              </CardHeader>
            </Card>

            {showMultiRole ? (
              <MultiRoleOnboardingFlow 
                onRoleSelect={handleMultiRoleSelect}
                selectedCommunity={selectedCommunity.id}
              />
            ) : (
              <SimpleRoleSelector
                onRoleSelect={handleRoleSelect}
                onMultiRoleSelect={() => setShowMultiRole(true)}
                existingRoles={getUserRoles(selectedCommunity.id)}
                loading={loading}
              />
            )}
          </div>
        )}

        {currentStep === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Welcome to the Community!</h2>
                <p className="text-muted-foreground">
                  Your account is set up and ready. You can now start exploring the marketplace.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Account setup completed in under 2 minutes</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
          className={currentStep === 0 ? "invisible" : ""}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex-1" />

        {currentStep < 2 && currentStep > 0 && (
          <Button 
            onClick={handleNext}
            disabled={currentStep === 1 && !selectedCommunity}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}