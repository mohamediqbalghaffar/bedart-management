'use client';

import React from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
