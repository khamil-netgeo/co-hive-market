import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CommunitySelection = {
  id: string | null;
  name: string | null;
};

type CommunityContextValue = {
  selected: CommunitySelection;
  setSelected: (sel: CommunitySelection) => void;
  clear: () => void;
};

const CommunityContext = createContext<CommunityContextValue | undefined>(undefined);

const STORAGE_KEY = "coop:selectedCommunity";

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelectedState] = useState<CommunitySelection>({ id: null, name: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CommunitySelection;
        setSelectedState(parsed);
      }
    } catch {}
  }, []);

  const setSelected = (sel: CommunitySelection) => {
    setSelectedState(sel);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sel)); } catch {}
  };

  const clear = () => setSelected({ id: null, name: null });

  const value = useMemo(() => ({ selected, setSelected, clear }), [selected]);

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
}
