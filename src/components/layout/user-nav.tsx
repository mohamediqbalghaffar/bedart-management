
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button";
import { ChevronUp, LogOut } from "lucide-react";
import { useAuth, useUser, useDoc, useMemoFirebase, doc, useFirestore } from "@/firebase";
import { Skeleton } from "../ui/skeleton";

type UserProfile = {
  username: string;
  role: string;
}

export function UserNav() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="p-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
       <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-auto p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-3 w-full">
                <Avatar className="h-9 w-9">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                    <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                </Avatar>
                <div className="text-right group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium leading-none text-sidebar-foreground">{userProfile?.username || user?.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile?.role || "بەکارهێنەر"}</p>
                </div>
                <ChevronUp className="h-4 w-4 mr-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile?.username || user?.email?.split('@')[0]}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>پڕۆفایل</DropdownMenuItem>
          <DropdownMenuItem>ڕێکخستنەکان</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="ml-2" />
          چوونەدەرەوە
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
