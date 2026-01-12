'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth, useUser, useDoc, useMemoFirebase, doc, useFirestore } from "@/firebase";
import { Skeleton } from "../ui/skeleton";

type UserProfile = {
  username: string;
  role: string;
}

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);


  if (isUserLoading || isProfileLoading) {
    return (
      <div className="p-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1">
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
    <div className="flex items-center gap-3 rounded-lg p-2 bg-secondary text-secondary-foreground">
        <Avatar className="h-9 w-9">
            {user?.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
        </Avatar>
        <div className="text-right">
            <p className="text-sm font-medium leading-none">{userProfile?.username || user?.email?.split('@')[0]}</p>
            <p className="text-xs leading-none text-muted-foreground">{userProfile?.role || "بەکارهێنەر"}</p>
        </div>
    </div>
  )
}
