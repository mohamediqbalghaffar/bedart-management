'use client';

import React from 'react';
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
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

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
    <div className="hidden border-l bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <BedDouble className="h-6 w-6 text-primary" />
                    <span className="">BedArt Group</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname === item.href && "bg-muted text-primary"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 space-y-4">
                <UserNav />
                 <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === '/settings' && "bg-muted text-primary"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    ڕێکخستنەکان
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    چوونەدەرەوە
                </Button>
            </div>
        </div>
    </div>
  );
}
