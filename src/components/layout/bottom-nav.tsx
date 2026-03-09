'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  Building, 
  DollarSign, 
  Archive, 
  PackageSearch, 
  MoreHorizontal,
  Settings
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

// Shared navigation items consistent with SidebarNav
const allNavLinks = [
  { href: '/sales', label: 'فرۆشتن', icon: ShoppingCart, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/purchases', label: 'کڕین', icon: Package, roles: ['admin', 'data manager'] },
  { href: '/stock', label: 'کۆگا', icon: Archive, roles: ['admin', 'data manager', 'salesman', 'program previewer'] },
  { href: '/products', label: 'کاڵا', icon: PackageSearch, roles: ['admin', 'data manager', 'program previewer'] },
  { href: '/customers', label: 'کڕیار', icon: Users, roles: ['admin', 'data manager', 'salesman'] },
  { href: '/suppliers', label: 'دابینکەر', icon: Building, roles: ['admin', 'data manager'] },
  { href: '/expenses', label: 'خەرجی', icon: DollarSign, roles: ['admin', 'data manager'] },
  { href: '/dashboard', label: 'داشبۆرد', icon: Home, roles: ['admin', 'data manager', 'salesman', 'program previewer'] },
];

const settingsLink = { href: '/settings', label: 'ڕێکخستن', icon: Settings, roles: ['admin', 'data manager'] };

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const userRole = user.role.toLowerCase();

  // Filter links based on role and allowed pages
  const filteredLinks = allNavLinks.filter(link => {
    if (!link.roles.includes(userRole)) return false;
    if ((userRole === 'salesman' || userRole === 'program previewer') && user.allowedPages) {
      return user.allowedPages.some(p => link.href.startsWith(p));
    }
    return true;
  });

  // Determine items for the bar and items for the "More" menu
  const visibleLinks = filteredLinks.length > 5 ? filteredLinks.slice(0, 4) : filteredLinks;
  const moreLinks = filteredLinks.length > 5 ? filteredLinks.slice(4) : [];
  
  // Add settings to more links if role allows
  const canSeeSettings = settingsLink.roles.includes(userRole);
  const finalMoreLinks = canSeeSettings ? [...moreLinks, settingsLink] : moreLinks;

  const NavItem = ({ link }: { link: typeof allNavLinks[0] }) => {
    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
    return (
      <Link
        href={link.href}
        className={cn(
          "flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <link.icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5px]")} />
        <span className="text-[10px] font-medium truncate w-full text-center">
          {link.label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border backdrop-blur-xl md:hidden safe-bottom">
      <div className="flex items-center justify-between h-16 max-w-md mx-auto">
        {visibleLinks.map((link) => (
          <NavItem key={link.href} link={link} />
        ))}

        {finalMoreLinks.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 py-2 px-1 text-muted-foreground">
                <MoreHorizontal className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">زیاتر</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-10" dir="rtl">
              <SheetHeader className="px-6 mb-4">
                <SheetTitle className="text-right">مێنۆی گشتی</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-y-6 px-4">
                {finalMoreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex flex-col items-center gap-2 p-2 rounded-xl transition-colors",
                      pathname.startsWith(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl",
                      pathname.startsWith(link.href) ? "bg-primary text-white" : "bg-muted"
                    )}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
