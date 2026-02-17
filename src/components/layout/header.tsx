'use client';

import Link from 'next/link';
import { BedDouble, Menu, Home, ShoppingCart, Package, Users, Building, DollarSign, Settings, Archive, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const allNavLinks = [
  { href: '/dashboard', label: 'داشبۆرد', icon: Home, roles: ['admin'] },
  { href: '/sales', label: 'فرۆشتنەکان', icon: ShoppingCart, roles: ['admin', 'salesman'] },
  { href: '/purchases', label: 'کڕینەکان', icon: Package, roles: ['admin'] },
  { href: '/stock', label: 'کۆگا', icon: Archive, roles: ['admin', 'salesman'] },
  { href: '/customers', label: 'کڕیارەکان', icon: Users, roles: ['admin'] },
  { href: '/suppliers', label: 'دابینکەران', icon: Building, roles: ['admin'] },
  { href: '/expenses', label: 'خەرجییەکان', icon: DollarSign, roles: ['admin'] },
  { href: '/settings', label: 'ڕێکخستنەکان', icon: Settings, roles: ['admin'] },
];

export function Header() {
  const pathname = usePathname();
  const { role, logout } = useAuth();

  const navLinks = allNavLinks.filter(link => role && link.roles.includes(role));

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-xs">
                 <nav className="grid gap-6 text-lg font-medium">
                    <Link
                        href="#"
                        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                    >
                        <BedDouble className="h-5 w-5 transition-all group-hover:scale-110" />
                        <span className="sr-only">BedArt Group</span>
                    </Link>
                     {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn("flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground", { 'text-foreground': pathname === link.href })}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    ))}
                 </nav>
            </SheetContent>
        </Sheet>
         <div className="flex-1 text-center text-lg font-semibold">BedArt Group</div>
         <Button size="icon" variant="ghost" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
        </Button>
    </header>
  );
}
