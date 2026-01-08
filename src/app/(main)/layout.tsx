'use client';

import React, { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
  params, // Destructure params to prevent enumeration issues
}: {
  children: React.ReactNode;
  params: any;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar side="left" collapsible="icon" variant="sidebar">
          <SidebarNav />
        </Sidebar>
        <main
          className={cn(
            "flex-1 transition-[margin-left] duration-200 ease-linear",
            "md:ml-[16rem] group-data-[sidebar-state=collapsed]:md:ml-[3.5rem]"
          )}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
