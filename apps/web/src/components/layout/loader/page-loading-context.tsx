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
  message: string;
  setLoadingState: (isLoading: boolean, message?: string) => void;
}

export const PageLoadingContext = createContext<PageLoadingContextType | null>(null);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  function setLoadingState(loading: boolean, msg?: string) {
    setIsLoading(loading);
    setMessage(msg ?? "Loading...");
  }

  return (
    <PageLoadingContext.Provider value={{ isLoading, message, setLoadingState }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading(isLoading: boolean, message?: string) {
  const ctx = useContext(PageLoadingContext);
  if (!ctx) throw new Error("usePageLoading used outside PageLoadingProvider");
  const { setLoadingState } = ctx;
  useEffect(() => {
    setLoadingState(isLoading, message);
    return () => setLoadingState(false);
  }, [isLoading, message, setLoadingState]);
}
