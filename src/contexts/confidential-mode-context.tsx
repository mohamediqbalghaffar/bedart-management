'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConfidentialModeContextType {
  isConfidential: boolean;
  toggleConfidentialMode: () => void;
}

const ConfidentialModeContext = createContext<ConfidentialModeContextType | undefined>(undefined);

export function ConfidentialModeProvider({ children }: { children: ReactNode }) {
  const [isConfidential, setIsConfidential] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem('confidentialMode');
    if (storedValue) {
      setIsConfidential(JSON.parse(storedValue));
    }
  }, []);

  const toggleConfidentialMode = () => {
    setIsConfidential(prev => {
      const newValue = !prev;
      localStorage.setItem('confidentialMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <ConfidentialModeContext.Provider value={{ isConfidential, toggleConfidentialMode }}>
      {children}
    </ConfidentialModeContext.Provider>
  );
}

export function useConfidentialMode() {
  const context = useContext(ConfidentialModeContext);
  if (context === undefined) {
    throw new Error('useConfidentialMode must be used within a ConfidentialModeProvider');
  }
  return context;
}
