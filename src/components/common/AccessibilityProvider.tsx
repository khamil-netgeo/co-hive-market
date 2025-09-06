import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  reduceMotion: boolean;
  highContrast: boolean;
  announceMessage: (message: string) => void;
  focusManagement: {
    trapFocus: (element: HTMLElement) => () => void;
    restoreFocus: (element: HTMLElement | null) => void;
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    // Create screen reader announcer
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.className = 'sr-only';
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  const announceMessage = (message: string) => {
    if (announcer) {
      announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
    }
  };

  const value: AccessibilityContextType = {
    reduceMotion,
    highContrast,
    announceMessage,
    focusManagement: {
      trapFocus,
      restoreFocus,
    },
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div className={`${reduceMotion ? 'reduce-motion' : ''} ${highContrast ? 'high-contrast' : ''}`}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};