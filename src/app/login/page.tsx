'use client';

import React, { useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { BedDouble, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WithId } from '@/firebase/firestore/use-collection';

type User = {
    name: string;
}

export default function LoginPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
  use(params);
  use(searchParams);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  if (isAuthLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const handleLogin = async () => {
    if (!name || !code) {
        toast({
            variant: 'destructive',
            title: 'زانیاری ناتەواو',
            description: 'تکایە ناو و کۆدی نهێنی بنووسە.',
        });
        return;
    }
    setIsLoading(true);
    
    const success = await login(name, code);
    if (!success) {
        toast({
            variant: 'destructive',
            title: 'زانیاری هەڵە',
            description: 'ناو یان کۆدی نهێنی هەڵەیە. تکایە دڵنیاببەرەوە و دووبارە هەوڵبدەرەوە.',
        });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
        <div className='absolute top-8 flex flex-col items-center gap-2'>
            <BedDouble className="h-10 w-10 text-primary" />
            <h1 className='text-2xl font-bold'>BedArt Group</h1>
        </div>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>چوونەژوورەوە</CardTitle>
          <CardDescription>
            بەکارهێنەرێک هەڵبژێرە و کۆدی نهێنی بنووسە.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ناو</Label>
            <Select onValueChange={setName} value={name} dir="rtl" disabled={isLoadingUsers}>
              <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsers ? "...چاوەڕوانبە" : "بەکارهێنەرێک هەڵبژێرە"} />
              </SelectTrigger>
              <SelectContent>
                  {users?.map((user: WithId<User>) => (
                      <SelectItem key={user.id} value={user.name}>
                          {user.name}
                      </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">کۆدی نهێنی</Label>
            <Input 
                id="code" 
                type="password"
                placeholder="••••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
           <Button onClick={handleLogin} disabled={isLoading || isLoadingUsers} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            چوونەژوورەوە
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
