import { useCallback, useRef } from 'react';

export const useAccessibilityAnnouncer = () => {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  const createAnnouncer = useCallback(() => {
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only absolute -left-[10000px] w-1 h-1 overflow-hidden';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }
    return announcerRef.current;
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    
    // Clear previous message
    announcer.textContent = '';
    
    // Announce new message with slight delay to ensure screen reader picks it up
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }, [createAnnouncer]);

  const announceRoute = useCallback((routeName: string) => {
    announce(`Navigated to ${routeName}`);
  }, [announce]);

  const announceAction = useCallback((action: string) => {
    announce(`${action} completed`);
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  return {
    announce,
    announceRoute,
    announceAction,
    announceError,
  };
};