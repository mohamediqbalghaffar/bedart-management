
'use client';

import React from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';

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
        <main className="flex-1 md:ml-[16rem] group-data-[sidebar-state=collapsed]:md:ml-[3.5rem] transition-[margin-left] duration-200 ease-linear">
            {children}
        </main>
    </SidebarProvider>
  );
}
