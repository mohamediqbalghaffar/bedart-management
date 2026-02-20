'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BedDouble, Home, ShoppingCart, Package, Users, Building, DollarSign, Settings, Archive, LogOut, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '../ui/button';
import { ActiveUsers } from './active-users';

const allNavLinks = [
  { href: '/sales', label: 'فرۆشتنەکان', icon: ShoppingCart, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/purchases', label: 'کڕینەکان', icon: Package, roles: ['admin', 'data manager'] },
  { href: '/stock', label: 'کۆگا', icon: Archive, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/products', label: 'ناوی کاڵاکان', icon: PackageSearch, roles: ['admin', 'data manager'] },
  { href: '/customers', label: 'کڕیارەکان', icon: Users, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/suppliers', label: 'دابینکەران', icon: Building, roles: ['admin', 'data manager'] },
  { href: '/expenses', label: 'خەرجییەکان', icon: DollarSign, roles: ['admin', 'data manager'] },
  { href: '/dashboard', label: 'داشبۆرد', icon: Home, roles: ['admin', 'data manager', 'salesman'] },
];

const settingsLink = { href: '/settings', label: 'ڕێکخستنەکان', icon: Settings, roles: ['admin', 'data manager'] };


export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = allNavLinks.filter(link => {
    if (!user) return false;
    const userRole = user.role.toLowerCase();

    if (!link.roles.includes(userRole)) {
        return false;
    }
    
    if (userRole === 'salesman') {
        return user.allowedPages?.includes(link.href);
    }
    
    return true;
  });

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <BedDouble className="h-6 w-6 text-primary" />
            <span>BedArt Group</span>
          </div>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  { 'bg-muted text-primary': pathname.startsWith(link.href) }
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 space-y-4">
            <Separator />
            {user && settingsLink.roles.includes(user.role.toLowerCase()) && (
                 <Link
                    href={settingsLink.href}
                    className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    { 'bg-muted text-primary': pathname.startsWith(settingsLink.href) }
                    )}
                >
                    <settingsLink.icon className="h-4 w-4" />
                    {settingsLink.label}
                </Link>
            )}
            
            <ActiveUsers currentUser={user} />

            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-4 w-4 mr-3" />
                چوونەدەرەوە
            </Button>
        </div>
      </div>
    </div>
  );
}
