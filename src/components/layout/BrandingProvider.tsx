import React, { createContext, useContext, ReactNode } from 'react';

interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  brandName: string;
  logoUrl?: string;
  tagline?: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (updates: Partial<BrandingConfig>) => void;
}

const defaultBranding: BrandingConfig = {
  primaryColor: 'hsl(324 100% 58%)', // TikTok pink
  secondaryColor: 'hsl(241 80% 62%)', // TikTok blue
  accentColor: 'hsl(290 100% 70%)', // Purple
  brandName: 'CoopMarket',
  tagline: 'Community-powered marketplace'
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
  initialBranding?: Partial<BrandingConfig>;
}

export function BrandingProvider({ children, initialBranding }: BrandingProviderProps) {
  const [branding, setBranding] = React.useState<BrandingConfig>({
    ...defaultBranding,
    ...initialBranding
  });

  const updateBranding = React.useCallback((updates: Partial<BrandingConfig>) => {
    setBranding(prev => ({ ...prev, ...updates }));
  }, []);

  const contextValue = React.useMemo(() => ({
    branding,
    updateBranding
  }), [branding, updateBranding]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

// Hook for consistent status colors
export function useStatusColors() {
  return {
    success: 'hsl(var(--brand-success))',
    warning: 'hsl(var(--brand-warning))',
    error: 'hsl(var(--destructive))',
    info: 'hsl(var(--brand-2))',
    neutral: 'hsl(var(--muted-foreground))'
  };
}

// Hook for consistent spacing
export function useSpacing() {
  return {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem'
  };
}