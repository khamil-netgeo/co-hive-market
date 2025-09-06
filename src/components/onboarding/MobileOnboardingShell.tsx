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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center justify-between p-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex-1 mx-4">
            {showProgress && (
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-1" />
                <div className="text-xs text-center text-muted-foreground">
                  {currentStep + 1} of {totalSteps}
                </div>
              </div>
            )}
          </div>
          
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Title Section */}
      <div className="px-6 py-4 text-center">
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        <div className={className}>
          {children}
        </div>
      </div>

      {/* Mobile Bottom Actions */}
      {onNext && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t p-4">
          <Button 
            onClick={onNext} 
            disabled={nextDisabled}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}