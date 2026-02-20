'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { FirebaseClientProvider } from '@/firebase';
import React from 'react';
import { ConfidentialModeProvider } from '@/contexts/confidential-mode-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AuthProvider>
                <ConfidentialModeProvider>
                    {children}
                </ConfidentialModeProvider>
            </AuthProvider>
        </FirebaseClientProvider>
    );
}
