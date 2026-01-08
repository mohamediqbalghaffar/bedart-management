
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, useSidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { cn } from '@/lib/utils';

function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <main
      className={cn(
        "flex-1 transition-[margin-left] duration-200 ease-linear",
        hasMounted && "md:ml-[16rem] group-data-[sidebar-state=collapsed]:md:ml-[3.5rem]"
      )}
    >
      {children}
    </main>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" variant="sidebar">
        <SidebarNav />
      </Sidebar>
      <MainContent>
        {children}
      </MainContent>
    </SidebarProvider>
  );
}
