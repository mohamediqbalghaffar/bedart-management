'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';

interface ConfidentialModeContextType {
  isConfidential: boolean;
  toggleConfidentialMode: () => void;
}

const ConfidentialModeContext = createContext<ConfidentialModeContextType | undefined>(undefined);

export function ConfidentialModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConfidentialState, setIsConfidentialState] = useState(false);

  const isPreviewer = user?.role === 'Program Previewer';

  useEffect(() => {
    if (isPreviewer) {
      // For previewer, mode is always on, no need to check storage.
      return;
    }
    try {
        const storedValue = localStorage.getItem('confidentialMode');
        if (storedValue) {
            setIsConfidentialState(JSON.parse(storedValue));
        }
    } catch (e) {
        console.error("Could not access localStorage for confidential mode", e);
    }
  }, [isPreviewer]);

  const toggleConfidentialMode = () => {
    if (isPreviewer) return; // Toggle is disabled for previewer
    
    setIsConfidentialState(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('confidentialMode', JSON.stringify(newValue));
      } catch (e) {
        console.error("Could not access localStorage for confidential mode", e);
      }
      return newValue;
    });
  };
  
  const finalIsConfidential = isPreviewer || isConfidentialState;

  return (
    <ConfidentialModeContext.Provider value={{ isConfidential: finalIsConfidential, toggleConfidentialMode }}>
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
