'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirestore, collection, query, where, getDocs, limit, setDoc, doc, updateDoc } from '@/firebase';

type Role = 'Admin' | 'Data Manager' | 'Salesman' | 'Program Previewer';

type User = {
    id: string;
    name: string;
    role: Role;
    code: string;
    photoURL?: string;
    status?: 'online' | 'offline';
    allowedPages?: string[];
};

type AuthUser = {
    id: string;
    name: string;
    role: Role;
    photoURL?: string;
    allowedPages?: string[];
};

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

  // S-02: Admin bootstrap removed — seed admin via Firebase Console or server-side script.
  // Never store credentials in client code.


  // S-04: Re-validate stored session against Firestore to prevent role tampering
  useEffect(() => {
    const validateSession = async () => {
      try {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as AuthUser;
          // Re-fetch from Firestore to validate role hasn't been tampered
          if (firestore && parsed.id) {
            try {
              const userDocRef = doc(firestore, 'users', parsed.id);
              const snap = await getDocs(query(collection(firestore, 'users'), where('name', '==', parsed.name), limit(1)));
              if (!snap.empty) {
                const freshData = snap.docs[0].data() as User;
                const validatedUser: AuthUser = {
                  id: snap.docs[0].id,
                  name: freshData.name,
                  role: freshData.role,
                  photoURL: freshData.photoURL,
                  allowedPages: freshData.allowedPages || [],
                };
                setUser(validatedUser);
                localStorage.setItem('authUser', JSON.stringify(validatedUser));
              } else {
                // User no longer exists in Firestore
                localStorage.removeItem('authUser');
                setUser(null);
              }
            } catch (fetchError) {
              // Firestore unavailable — fall back to cached session
              console.warn('Could not validate session against Firestore, using cached:', fetchError);
              setUser(parsed);
            }
          } else {
            // Firestore not ready yet, use cached
            setUser(parsed);
          }
        }
      } catch (error) {
        console.error("Could not access localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, [firestore]);
  
  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Real-time presence management using Page Visibility API
  useEffect(() => {
    if (!user || !user.id || !firestore) {
      return;
    }

    const userStatusRef = doc(firestore, 'users', user.id);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateDoc(userStatusRef, { status: 'offline' });
      } else {
        updateDoc(userStatusRef, { status: 'online' });
      }
    };
    
    const handleBeforeUnload = () => {
        // This is a best-effort attempt to set the user offline.
        updateDoc(userStatusRef, { status: 'offline' });
    };

    // Set user online when they first load/focus the page
    updateDoc(userStatusRef, { status: 'online' });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Set user offline when the component unmounts (e.g., logout)
      updateDoc(userStatusRef, { status: 'offline' });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, firestore]);

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
            const authUser: AuthUser = { id: userDoc.id, name: userData.name, role: userData.role, photoURL: userData.photoURL, allowedPages: userData.allowedPages || [] };
            
            // The presence useEffect will immediately set the status to 'online' after login.
            
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

  const logout = async () => {
    if (user && firestore) {
        try {
            // Explicitly set offline on logout for immediate effect
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { status: 'offline' });
        } catch (error) {
            console.error("Failed to update user status on logout", error);
        }
    }

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
  return context;
}
