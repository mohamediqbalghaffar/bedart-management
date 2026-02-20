'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection, query, where } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';

type ActiveUser = {
    name: string;
    photoURL?: string;
};

type AuthUser = {
    id: string;
    name: string;
    photoURL?: string;
    role: string;
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function ActiveUsers({ currentUser }: { currentUser: AuthUser | null }) {
    const firestore = useFirestore();

    const activeUsersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('status', '==', 'online'));
    }, [firestore]);

    const { data: activeUsers, isLoading } = useCollection<ActiveUser>(activeUsersQuery);

    if (!currentUser) {
        return null;
    }

    // Filter out the current user from the list of active users
    const otherActiveUsers = activeUsers?.filter(user => user.id !== currentUser.id);

    return (
        <div className="space-y-2">
            <Separator />
            <div className="px-3 py-2 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Active Now</p>
                <div className="flex items-center -space-x-2 rtl:space-x-reverse overflow-hidden">
                    <TooltipProvider delayDuration={0}>
                        {/* Current User */}
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="relative">
                                    <Avatar className="h-8 w-8 border-2 border-green-500">
                                        <AvatarImage src={currentUser.photoURL} alt={currentUser.name} />
                                        <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>{currentUser.name} (You)</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Other Active Users */}
                        {otherActiveUsers?.map(user => (
                            <Tooltip key={user.id}>
                                <TooltipTrigger>
                                    <Avatar className="h-8 w-8 border-2 border-card">
                                        <AvatarImage src={user.photoURL} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>{user.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
