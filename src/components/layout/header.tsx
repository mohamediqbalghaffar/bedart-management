'use client';

import Link from 'next/link';
import { BedDouble, Menu, Home, ShoppingCart, Package, Users, Building, DollarSign, Settings, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const allNavLinks = [
  { href: '/dashboard', label: 'داشبۆرد', icon: Home, adminOnly: false },
  { href: '/sales', label: 'فرۆشتنەکان', icon: ShoppingCart, adminOnly: false },
  { href: '/purchases', label: 'کڕینەکان', icon: Package, adminOnly: true },
  { href: '/stock', label: 'کۆگا', icon: Archive, adminOnly: false },
  { href: '/customers', label: 'کڕیارەکان', icon: Users, adminOnly: false },
  { href: '/suppliers', label: 'دابینکەران', icon: Building, adminOnly: true },
  { href: '/expenses', label: 'خەرجییەکان', icon: DollarSign, adminOnly: true },
  { href: '/settings', label: 'ڕێکخستنەکان', icon: Settings, adminOnly: true },
];

export function Header() {
  const { userProfile } = useUser();
  const pathname = usePathname();

  const navLinks = userProfile?.role === 'Admin' 
    ? allNavLinks 
    : allNavLinks.filter(link => !link.adminOnly);

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
    </header>
  );
}
