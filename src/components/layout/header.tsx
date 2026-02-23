'use client';

import Link from 'next/link';
import { BedDouble, Menu, Home, ShoppingCart, Package, Users, Building, DollarSign, Settings, Archive, LogOut, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const allNavLinks = [
  { href: '/dashboard', label: 'داشبۆرد', icon: Home, roles: ['admin', 'data manager', 'salesman', 'program previewer'] },
  { href: '/sales', label: 'فرۆشتنەکان', icon: ShoppingCart, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/purchases', label: 'کڕینەکان', icon: Package, roles: ['admin', 'data manager'] },
  { href: '/expenses', label: 'خەرجییەکان', icon: DollarSign, roles: ['admin', 'data manager'] },
  { href: '/stock', label: 'کۆگا', icon: Archive, roles: ['admin', 'data manager', 'salesman', 'program previewer'] },
  { href: '/products', label: 'ناوی کاڵاکان', icon: PackageSearch, roles: ['admin', 'data manager', 'program previewer'] },
  { href: '/customers', label: 'کڕیارەکان', icon: Users, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/suppliers', label: 'دابینکەران', icon: Building, roles: ['admin', 'data manager'] },
  { href: '/settings', label: 'ڕێکخستنەکان', icon: Settings, roles: ['admin', 'data manager'] },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = allNavLinks.filter(link => {
    if (!user) return false;
    const userRole = user.role.toLowerCase();

    if (!link.roles.includes(userRole)) {
        return false;
    }
    
    if (userRole === 'salesman' || userRole === 'program previewer') {
        return user.allowedPages?.includes(link.href);
    }
    
    return true;
  });

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
                <SheetHeader>
                    <SheetTitle>
                        <div className="flex items-center gap-2 font-semibold">
                            <BedDouble className="h-6 w-6 text-primary" />
                            <span className="animated-gradient-border">BedArt Group</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>
                 <nav className="grid gap-2 text-lg font-medium mt-6">
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
            </SheetContent>
        </Sheet>
         <div className="flex-1 text-center text-lg font-semibold">
            <span className="animated-gradient-border">BedArt Group</span>
         </div>
         <Button size="icon" variant="ghost" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
        </Button>
    </header>
  );
}
