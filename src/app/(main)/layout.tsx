'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';

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
            <main className="flex-1">
                {children}
            </main>
        </div>
    </SidebarProvider>
  );
}
