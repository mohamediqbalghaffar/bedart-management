'use client';

import { BedDouble, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
         <div className="flex items-center gap-2 font-semibold">
            <img src="/logo.png" alt="BedArt Group" className="h-8 w-auto object-contain" />
         </div>
         <div className="flex-1" />
         <Button size="icon" variant="ghost" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
        </Button>
    </header>
  );
}
