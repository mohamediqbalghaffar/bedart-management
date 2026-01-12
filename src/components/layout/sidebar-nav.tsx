'use client';

import React from 'react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
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
  LogOut,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { UserNav } from './user-nav';

const menuItems = [
  { href: '/dashboard', label: 'داشبۆرد', icon: LayoutDashboard },
  { href: '/sales', label: 'فرۆشەکان', icon: ShoppingCart },
  { href: '/purchases', label: 'کڕینەکان', icon: Package },
  { href: '/stock', label: 'کۆگا', icon: Warehouse },
  { href: '/customers', label: 'کڕیارەکان', icon: Users },
  { href: '/suppliers', label: 'دابینکەران', icon: Truck },
  { href: '/expenses', label: 'خەرجییەکان', icon: CreditCard },
];

export function SidebarNav() {
  const pathname = usePathname();
  const auth = useAuth();

  const handleLogout = () => {
    if(auth) {
      auth.signOut();
    }
  }

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BedDouble className="h-6 w-6" />
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <h2 className="text-lg font-semibold text-sidebar-foreground font-headline">BedArt Group</h2>
                </div>
            </div>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
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
      <SidebarFooter className='flex flex-col gap-4'>
        <UserNav />
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
           <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={{ children: 'چوونەدەرەوە', side: 'left' }}
              >
                <LogOut />
                <span>چوونەدەرەوە</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
