
'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './(main)/layout';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
