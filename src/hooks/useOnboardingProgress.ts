import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProductionLogging } from './useProductionLogging';

interface OnboardingProgress {
  currentStep: number;
  selectedCommunity?: string;
  selectedRoles?: string[];
  completedSteps: number[];
  startedAt: string;
  lastUpdatedAt: string;
  mode?: 'wizard' | 'classic';
}

interface OnboardingAnalytics {
  sessionId: string;
  userId?: string;
  startedAt: string;
  currentStep: number;
  completedSteps: number[];
  dropOffPoint?: number;
  completedAt?: string;
  timeToComplete?: number;
  mode: 'wizard' | 'classic';
  selectedCommunity?: string;
  finalRoles?: string[];
  errors: Array<{
    step: number;
    error: string;
    timestamp: string;
  }>;
}

export function useOnboardingProgress() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [analytics, setAnalytics] = useState<OnboardingAnalytics | null>(null);
  const { info, error: logError } = useProductionLogging();

  // Initialize or load existing progress
  useEffect(() => {
    loadProgress();
  }, []);

  const generateSessionId = () => {
    return `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const loadProgress = () => {
    try {
      const savedProgress = localStorage.getItem('onboardingProgress');
      const savedAnalytics = localStorage.getItem('onboardingAnalytics');
      
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        // Check if progress is recent (within 24 hours)
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        if (new Date(parsed.lastUpdatedAt).getTime() > dayAgo) {
          setProgress(parsed);
          info('Loaded existing onboarding progress', 'onboarding', { step: parsed.currentStep });
        } else {
          // Clear old progress
          clearProgress();
        }
      }

      if (savedAnalytics) {
        setAnalytics(JSON.parse(savedAnalytics));
      }
    } catch (error) {
      logError('Failed to load onboarding progress', 'onboarding', error);
      clearProgress();
    }
  };

  const saveProgress = (newProgress: Partial<OnboardingProgress>) => {
    try {
      const updatedProgress: OnboardingProgress = {
        ...progress,
        ...newProgress,
        lastUpdatedAt: new Date().toISOString(),
      } as OnboardingProgress;

      setProgress(updatedProgress);
      localStorage.setItem('onboardingProgress', JSON.stringify(updatedProgress));
      
      // Update analytics
      updateAnalytics({
        currentStep: updatedProgress.currentStep,
        completedSteps: updatedProgress.completedSteps,
      });

      info('Saved onboarding progress', 'onboarding', { 
        step: updatedProgress.currentStep,
        mode: updatedProgress.mode 
      });
    } catch (error) {
      logError('Failed to save onboarding progress', 'onboarding', error);
    }
  };

  const initializeProgress = (mode: 'wizard' | 'classic' = 'wizard') => {
    const newProgress: OnboardingProgress = {
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      mode,
    };

    const newAnalytics: OnboardingAnalytics = {
      sessionId: generateSessionId(),
      startedAt: new Date().toISOString(),
      currentStep: 0,
      completedSteps: [],
      mode,
      errors: [],
    };

    setProgress(newProgress);
    setAnalytics(newAnalytics);
    localStorage.setItem('onboardingProgress', JSON.stringify(newProgress));
    localStorage.setItem('onboardingAnalytics', JSON.stringify(newAnalytics));

    info('Initialized onboarding progress', 'onboarding', { mode, sessionId: newAnalytics.sessionId });
  };

  const updateStep = (step: number, completed: boolean = false) => {
    if (!progress) return;

    const completedSteps = completed 
      ? [...progress.completedSteps, step].filter((s, i, arr) => arr.indexOf(s) === i)
      : progress.completedSteps;

    saveProgress({
      currentStep: step,
      completedSteps,
    });
  };

  const updateCommunitySelection = (communityId: string) => {
    if (!progress) return;

    saveProgress({
      selectedCommunity: communityId,
    });

    updateAnalytics({
      selectedCommunity: communityId,
    });
  };

  const updateRoleSelection = (roles: string[]) => {
    if (!progress) return;

    saveProgress({
      selectedRoles: roles,
    });

    updateAnalytics({
      finalRoles: roles,
    });
  };

  const recordError = (step: number, error: string) => {
    if (!analytics) return;

    const newError = {
      step,
      error,
      timestamp: new Date().toISOString(),
    };

    const updatedAnalytics = {
      ...analytics,
      errors: [...analytics.errors, newError],
    };

    setAnalytics(updatedAnalytics);
    localStorage.setItem('onboardingAnalytics', JSON.stringify(updatedAnalytics));

    logError('Onboarding error recorded', 'onboarding', { step, error, sessionId: analytics.sessionId });
  };

  const updateAnalytics = (updates: Partial<OnboardingAnalytics>) => {
    if (!analytics) return;

    const updatedAnalytics = {
      ...analytics,
      ...updates,
    };

    setAnalytics(updatedAnalytics);
    localStorage.setItem('onboardingAnalytics', JSON.stringify(updatedAnalytics));
  };

  const completeOnboarding = async (finalRoles: string[], communityId: string) => {
    if (!progress || !analytics) return;

    const completedAt = new Date().toISOString();
    const timeToComplete = Date.now() - new Date(analytics.startedAt).getTime();

    const finalAnalytics = {
      ...analytics,
      completedAt,
      timeToComplete,
      finalRoles,
      selectedCommunity: communityId,
      currentStep: 999, // Completion marker
    };

    setAnalytics(finalAnalytics);
    localStorage.setItem('onboardingAnalytics', JSON.stringify(finalAnalytics));

    // Send analytics to backend
    await sendAnalyticsToBackend(finalAnalytics);

    info('Onboarding completed', 'onboarding', {
      sessionId: analytics.sessionId,
      timeToComplete: Math.round(timeToComplete / 1000),
      mode: analytics.mode,
      finalRoles,
    });

    // Clear progress after successful completion
    clearProgress();
  };

  const recordDropOff = async (step: number) => {
    if (!analytics) return;

    const updatedAnalytics = {
      ...analytics,
      dropOffPoint: step,
    };

    setAnalytics(updatedAnalytics);
    localStorage.setItem('onboardingAnalytics', JSON.stringify(updatedAnalytics));

    // Send drop-off analytics
    await sendAnalyticsToBackend(updatedAnalytics);

    info('Onboarding drop-off recorded', 'onboarding', {
      sessionId: analytics.sessionId,
      dropOffPoint: step,
      mode: analytics.mode,
    });
  };

  const sendAnalyticsToBackend = async (analyticsData: OnboardingAnalytics) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Store in audit logs for analytics
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action: analyticsData.completedAt ? 'onboarding.completed' : 'onboarding.dropped_off',
          resource_type: 'onboarding',
          resource_id: analyticsData.sessionId,
          metadata: {
            ...analyticsData,
            userId: user?.id,
          }
        });

      if (error) throw error;

      info('Analytics sent to backend', 'onboarding', { sessionId: analyticsData.sessionId });
    } catch (error) {
      logError('Failed to send analytics to backend', 'onboarding', error);
    }
  };

  const clearProgress = () => {
    setProgress(null);
    setAnalytics(null);
    localStorage.removeItem('onboardingProgress');
    localStorage.removeItem('onboardingAnalytics');
    info('Onboarding progress cleared', 'onboarding');
  };

  const hasProgress = !!progress;
  const canResume = hasProgress && progress.currentStep > 0;
  const completionPercentage = progress 
    ? Math.round((progress.completedSteps.length / 4) * 100) // 4 total steps
    : 0;

  return {
    progress,
    analytics,
    hasProgress,
    canResume,
    completionPercentage,
    initializeProgress,
    saveProgress,
    updateStep,
    updateCommunitySelection,
    updateRoleSelection,
    completeOnboarding,
    recordError,
    recordDropOff,
    clearProgress,
    loadProgress,
  };
}