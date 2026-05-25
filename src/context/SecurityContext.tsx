"use client";

import React, { createContext, useContext, useState } from "react";

interface SecurityContextType {
  getPassphrase: (key: string) => string | undefined;
  setPassphrase: (key: string, value: string) => void;
  clearPassphrases: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Record<string, string>>({});

  const getPassphrase = (key: string) => cache[key];
  
  const setPassphrase = (key: string, value: string) => {
    setCache((prev) => ({ ...prev, [key]: value }));
  };

  const clearPassphrases = () => setCache({});

  return (
    <SecurityContext.Provider value={{ getPassphrase, setPassphrase, clearPassphrases }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
