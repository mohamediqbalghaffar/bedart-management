'use client';

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';

const salesmanRestrictedRoutes = [
    '/settings',
    '/expenses',
    '/purchases',
    '/suppliers'
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
      if (userProfile && userProfile.role === 'Salesman') {
          if (salesmanRestrictedRoutes.some(route => pathname.startsWith(route))) {
              router.replace('/dashboard');
          }
      }
  }, [userProfile, pathname, router]);

  // The primary loading state should be the initial user auth check.
  // Profile loading is secondary and the UI can handle a null profile.
  const isLoading = isUserLoading || (user && isProfileLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If after loading, there is still no user, something is wrong.
  // The useEffect above should handle redirection, but this is a fallback.
  if (!user) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SidebarNav />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background/95 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}
