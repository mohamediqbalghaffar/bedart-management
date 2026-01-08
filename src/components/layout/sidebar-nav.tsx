'use client';

import React from 'react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  CreditCard,
  Users,
  Truck,
  Settings,
  BedDouble,
} from 'lucide-react';
import { UserNav } from './user-nav';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const menuItems = [
  { href: '/', label: 'داشبۆرد', icon: LayoutDashboard },
  { href: '/sales', label: 'فرۆشەکان', icon: ShoppingCart },
  { href: '/purchases', label: 'کڕینەکان', icon: Package },
  { href: '/stock', label: 'کۆگا', icon: Warehouse },
  { href: '/expenses', label: 'خەرجییەکان', icon: CreditCard },
  { href: '/customers', label: 'کڕیارەکان', icon: Users },
  { href: '/suppliers', label: 'دابینکەران', icon: Truck },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <BedDouble className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-semibold text-sidebar-foreground font-headline">BedArt Group</h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: 'left' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <Link href="/settings">
                <SidebarMenuButton
                  isActive={pathname === '/settings'}
                  tooltip={{ children: 'ڕێکخستنەکان', side: 'left' }}
                >
                  <Settings />
                  <span>ڕێکخستنەکان</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <UserNav />
      </SidebarFooter>
    </>
  );
}
