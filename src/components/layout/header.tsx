'use client';

import Link from 'next/link';
import { BedDouble, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserNav } from '@/components/layout/user-nav';

const navLinks = [
  { href: '/dashboard', label: 'داشبۆرد' },
  { href: '/sales', label: 'فرۆشەکان' },
  { href: '/purchases', label: 'کڕینەکان' },
  { href: '/stock', label: 'کۆگا' },
  { href: '/customers', label: 'کڕیارەکان' },
  { href: '/suppliers', label: 'دابینکەران' },
  { href: '/expenses', label: 'خەرجییەکان' },
  { href: '/settings', label: 'ڕێکخستنەکان' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/" className="mr-6 flex items-center space-x-2">
            <BedDouble className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              BedArt Group
            </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end gap-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
