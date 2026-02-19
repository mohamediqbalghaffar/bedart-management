'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { FirebaseClientProvider } from '@/firebase';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </FirebaseClientProvider>
    );
}
