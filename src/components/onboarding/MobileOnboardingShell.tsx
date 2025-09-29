import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOnboardingShellProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function MobileOnboardingShell({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  showProgress = true,
  className = ""
}: MobileOnboardingShellProps) {
  const isMobile = useIsMobile();
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  if (!isMobile) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Mobile Header - Enhanced */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90 border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex-1 mx-4">
            {showProgress && (
              <div className="space-y-3">
                <Progress value={progressPercentage} className="h-2 bg-muted/50" />
                <div className="text-xs text-center text-muted-foreground font-medium">
                  Step {currentStep + 1} of {totalSteps}
                </div>
              </div>
            )}
          </div>
          
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Title Section - Enhanced */}
      <div className="px-6 py-6 text-center bg-gradient-to-b from-transparent to-muted/10">
        <h1 className="text-2xl font-bold leading-tight text-foreground mb-2">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Content - Enhanced spacing */}
      <div className="flex-1 px-5 pb-28 overflow-y-auto">
        <div className={`max-w-lg mx-auto ${className}`}>
          {children}
        </div>
      </div>

      {/* Mobile Bottom Actions - Enhanced */}
      {onNext && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-lg supports-[backdrop-filter]:bg-background/95 border-t border-border/50 p-5 shadow-lg">
          <div className="max-w-lg mx-auto">
            <Button 
              onClick={onNext} 
              disabled={nextDisabled}
              className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}