import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

interface OnboardingAnalyticsProviderProps {
  children: React.ReactNode;
}

export default function OnboardingAnalyticsProvider({ children }: OnboardingAnalyticsProviderProps) {
  const location = useLocation();
  const { analytics, recordDropOff } = useOnboardingProgress();

  // Track page unload for drop-off detection
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only record drop-off if user is in the middle of onboarding
      if (analytics && !analytics.completedAt && analytics.currentStep < 999) {
        // Use sendBeacon for reliable analytics on page unload
        recordDropOff(analytics.currentStep);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && analytics && !analytics.completedAt) {
        // User may be navigating away
        recordDropOff(analytics.currentStep);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [analytics, recordDropOff]);

  // Track route changes that might indicate drop-off
  useEffect(() => {
    if (analytics && !analytics.completedAt && analytics.currentStep < 999) {
      // If user navigates away from onboarding pages
      if (!location.pathname.includes('/getting-started') && !location.pathname.includes('/auth')) {
        recordDropOff(analytics.currentStep);
      }
    }
  }, [location.pathname, analytics, recordDropOff]);

  return <>{children}</>;
}