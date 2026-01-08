'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useFirestore } from '@/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { BedDouble, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, { message: 'وشەی نهێنی دەبێت لە 6 پیت کەمتر نەبێت.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // First, try to sign in the user
      await signInWithEmailAndPassword(auth, data.email, data.password);
      window.location.href = '/';
    } catch (error) {
      const authError = error as AuthError;
      // If the user does not exist, create a new account
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          const user = userCredential.user;

          if (user && firestore) {
            // Create user profile in Firestore
            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
              id: user.uid,
              username: user.email,
              role: 'Salesman', // Default role for new sign-ups
            });
          }
          window.location.href = '/';
        } catch (creationError) {
          console.error('Account creation failed:', creationError);
          form.setError('root', { message: 'هەژمار دروستنەکرا. تکایە دووبارە هەوڵبدەرەوە.' });
        }
      } else {
        console.error('Login failed:', error);
        form.setError('root', { message: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.' });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background/80" style={{ backgroundImage: 'url(https://picsum.photos/seed/login-bg/1920/1080)', backgroundSize: 'cover' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <BedDouble className="h-8 w-8 text-primary-foreground" />
                </div>
            </div>
          <CardTitle>MattressPro CRM</CardTitle>
          <CardDescription>زانیارییەکانت بنووسە بۆ چوونەژوورەوە یان خۆتۆمارکردن</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ئیمەیڵ</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وشەی نهێنی</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} {...field} className="pl-10" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 h-full -translate-y-1/2 px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '...چاوەڕوانبە' : 'چوونەژوورەوە / خۆتۆمارکردن'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
            <p>ئەم سیستەمە سنووردارە.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
