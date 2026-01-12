
'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './(main)/layout';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we're on the login page, just render the children (the login page itself)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // For all other pages, wrap them in the main application layout which includes the sidebar
  return <MainLayout>{children}</MainLayout>;
}
