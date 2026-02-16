'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

const roleTranslations: Record<string, string> = {
    'Admin': 'بەڕێوەبەر',
    'Data Manager': 'داتا مانجەر',
    'Salesman': 'فرۆشیار'
}

export function UserNav() {
  const auth = useAuth();
  const { user, userProfile } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };
  
  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex items-center gap-4">
        <Avatar className="hidden h-9 w-9 sm:flex">
          <AvatarImage src="#" alt="Avatar" />
          <AvatarFallback>{user ? getInitials(user.email || '') : '...'}</AvatarFallback>
        </Avatar>
        <div className="grid gap-0.5">
          <p className="text-sm font-medium leading-none">{userProfile?.role ? roleTranslations[userProfile.role] : 'بەکارهێنەر'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" className="mr-auto" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
        </Button>
    </div>
  );
}
