'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, and we're not on the login page, redirect.
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // While checking for the user, show a loader (unless on the login page)
  if (isUserLoading && pathname !== '/login') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on the login page, just render the content of the login page.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If we have a user and are not on the login page, show the main app layout.
  if (user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
            {children}
        </main>
      </div>
    );
  }

  // If no user and not on login, we're likely redirecting, so show a loader.
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
