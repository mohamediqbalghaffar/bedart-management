'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { BedDouble, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

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
    // On success, the auth context will redirect automatically.
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
            تکایە ناو و کۆدی نهێنی بنووسە.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ناو</Label>
            <Input 
                id="name" 
                type="text"
                placeholder="ناوی بەکارهێنەر"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
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
           <Button onClick={handleLogin} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            چوونەژوورەوە
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
