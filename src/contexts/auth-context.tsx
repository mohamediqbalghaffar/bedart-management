'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'salesman';

interface AuthContextType {
  role: Role | null;
  isLoading: boolean;
  login: (role: Role, code: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CODE = 'Rawezh1818';
const SALESMAN_CODE = '123456';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role | null;
      if (storedRole) {
        setRole(storedRole);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (selectedRole: Role, code: string): boolean => {
    let isValid = false;
    if (selectedRole === 'admin' && code === ADMIN_CODE) {
      isValid = true;
    } else if (selectedRole === 'salesman' && code === SALESMAN_CODE) {
      isValid = true;
    }

    if (isValid) {
      setRole(selectedRole);
      try {
        localStorage.setItem('userRole', selectedRole);
      } catch (error) {
        console.error("Could not write to localStorage:", error);
      }
      router.push('/dashboard');
      return true;
    } else {
      return false;
    }
  };

  const logout = () => {
    setRole(null);
    try {
      localStorage.removeItem('userRole');
    } catch (error) {
       console.error("Could not remove from localStorage:", error);
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
