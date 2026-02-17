'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { BedDouble, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [adminCode, setAdminCode] = useState('');
  const [salesmanCode, setSalesmanCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (role: 'admin' | 'salesman') => {
    setIsLoading(true);
    const code = role === 'admin' ? adminCode : salesmanCode;
    
    // Simulate a short delay
    setTimeout(() => {
        const success = login(role, code);
        if (!success) {
            toast({
                variant: 'destructive',
                title: 'کۆدی هەڵە',
                description: 'کۆدی نهێنییەکەت هەڵەیە. تکایە دڵنیاببەرەوە و دووبارە هەوڵبدەرەوە.',
            });
            setIsLoading(false);
        }
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
        <div className='absolute top-8 flex flex-col items-center gap-2'>
            <BedDouble className="h-10 w-10 text-primary" />
            <h1 className='text-2xl font-bold'>BedArt Group</h1>
        </div>
      <Tabs defaultValue="admin" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin">بەڕێوەبەر</TabsTrigger>
          <TabsTrigger value="salesman">فرۆشیار</TabsTrigger>
        </TabsList>
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>چوونەژوورەوەی بەڕێوەبەر</CardTitle>
              <CardDescription>
                تکایە کۆدی تایبەت بە بەڕێوەبەر بنووسە.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-code">کۆدی نهێنی</Label>
                <Input 
                    id="admin-code" 
                    type="password" 
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin('admin')}
                />
              </div>
               <Button onClick={() => handleLogin('admin')} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                چوونەژوورەوە
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="salesman">
          <Card>
            <CardHeader>
              <CardTitle>چوونەژوورەوەی فرۆشیار</CardTitle>
              <CardDescription>
                 تکایە کۆدی تایبەت بە فرۆشیار بنووسە.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salesman-code">کۆدی نهێنی</Label>
                <Input 
                    id="salesman-code" 
                    type="password" 
                    value={salesmanCode}
                    onChange={(e) => setSalesmanCode(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleLogin('salesman')}
                />
              </div>
              <Button onClick={() => handleLogin('salesman')} disabled={isLoading} className="w-full">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 چوونەژوورەوە
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
