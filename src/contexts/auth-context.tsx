'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore, collection, query, where, getDocs } from '@/firebase';

type Role = 'Admin' | 'Data Manager' | 'Salesman';
type User = {
    id: string;
    name: string;
    role: Role;
    code: string;
}
type AuthUser = {
    name: string;
    role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (name: string, code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
   useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (name: string, code: string): Promise<boolean> => {
    if (!firestore) {
        console.error("Firestore is not initialized.");
        return false;
    }

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("name", "==", name));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log("No user found with that name.");
            return false;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;

        if (userData.code === code) {
            const authUser: AuthUser = { name: userData.name, role: userData.role };
            setUser(authUser);
            try {
                localStorage.setItem('authUser', JSON.stringify(authUser));
            } catch (error) {
                console.error("Could not write to localStorage:", error);
            }
            router.push('/dashboard');
            return true;
        } else {
            console.log("Incorrect code.");
            return false;
        }
    } catch (error) {
        console.error("Error during login:", error);
        return false;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('authUser');
    } catch (error) {
       console.error("Could not remove from localStorage:", error);
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { user } = context;
  return { ...context, role: user?.role || null };
}
