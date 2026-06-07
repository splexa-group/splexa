"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface PageLoadingContextType {
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

export const PageLoadingContext = createContext<PageLoadingContextType | null>(
  null,
);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);
  return (
    <PageLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading(isLoading: boolean) {
  const ctx = useContext(PageLoadingContext);
  if (!ctx) throw new Error("usePageLoading used outside PageLoadingProvider");
  const { setLoading } = ctx;
  useEffect(() => {
    setLoading(isLoading);
    return () => setLoading(false);
  }, [isLoading, setLoading]);
}
