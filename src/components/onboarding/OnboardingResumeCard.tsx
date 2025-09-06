import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  PlayCircle, 
  Clock, 
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

interface OnboardingResumeCardProps {
  onResume: () => void;
  onRestart: () => void;
}

export default function OnboardingResumeCard({ onResume, onRestart }: OnboardingResumeCardProps) {
  const { progress, completionPercentage, clearProgress } = useOnboardingProgress();
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (progress?.lastUpdatedAt) {
      const updateTimeAgo = () => {
        const diff = Date.now() - new Date(progress.lastUpdatedAt).getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
        } else if (hours > 0) {
          setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
        } else if (minutes > 0) {
          setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
        } else {
          setTimeAgo('Just now');
        }
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [progress?.lastUpdatedAt]);

  if (!progress) return null;

  const getStepName = (step: number) => {
    const steps = ['Welcome', 'Community Selection', 'Role Selection', 'Complete'];
    return steps[step] || `Step ${step + 1}`;
  };

  const handleRestart = () => {
    clearProgress();
    onRestart();
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resume Your Setup</CardTitle>
          </div>
          <Badge variant="secondary">
            {completionPercentage}% complete
          </Badge>
        </div>
        <CardDescription>
          Continue where you left off • Last updated {timeAgo}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{progress.completedSteps.length} of 4 steps</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Current Step:</div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
              {progress.currentStep + 1}
            </div>
            <span className="text-sm">{getStepName(progress.currentStep)}</span>
          </div>
        </div>

        {progress.selectedCommunity && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Selected Community:</div>
            <div className="text-sm text-muted-foreground">
              {progress.selectedCommunity}
            </div>
          </div>
        )}

        {progress.selectedRoles && progress.selectedRoles.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Selected Roles:</div>
            <div className="flex gap-1 flex-wrap">
              {progress.selectedRoles.map((role) => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={onResume} className="flex-1">
            <PlayCircle className="h-4 w-4 mr-2" />
            Continue Setup
          </Button>
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Your progress is automatically saved as you go
        </div>
      </CardContent>
    </Card>
  );
}