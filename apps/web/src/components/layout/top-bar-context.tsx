'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface TopBarContextValue {
  resourceTitle: string | null;
  setResourceTitle: (title: string | null) => void;
}

export const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [resourceTitle, setResourceTitle] = useState<string | null>(null);
  return (
    <TopBarContext.Provider value={{ resourceTitle, setResourceTitle }}>
      {children}
    </TopBarContext.Provider>
  );
}

// Only detail pages need this — one line, e.g. usePageTitle(caseData.title)
export function usePageTitle(title: string) {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('usePageTitle must be used inside TopBarProvider');
  const { setResourceTitle } = ctx;
  useEffect(() => {
    setResourceTitle(title);
    return () => setResourceTitle(null);
  }, [title, setResourceTitle]);
}
