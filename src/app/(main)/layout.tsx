'use client';

import { useEffect } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'Salesman' || user.role === 'Program Previewer') {
        const allowedPages = user.allowedPages || [];
        // If the salesman has no pages allowed, or is trying to access an unallowed page
        if (allowedPages.length === 0) {
            router.push('/login'); // Or an access denied page
        } else if (!allowedPages.some(p => pathname.startsWith(p))) {
            router.push(allowedPages[0]); // Redirect to the first allowed page
        }
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
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
