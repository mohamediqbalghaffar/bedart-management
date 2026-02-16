'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, useFirestore, doc, getDoc, setDoc } from '@/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { BedDouble, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  role: z.enum(['admin', 'salesman'], {
    required_error: "تکایە ڕۆڵێک هەڵبژێرە.",
  }),
  password: z.string().min(1, { message: 'تکایە وشەی نهێنی بنووسە.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: undefined,
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!auth || !firestore) {
        form.setError('root', { message: 'خزمەتگوزاری چوونەژوورەوە ئامادە نییە. تکایە دووبارە هەوڵبدەرەوە.' });
        return;
    };

    const email = data.role === 'admin' ? 'admin@bedart.group' : 'salesman@bedart.group';
    const password = data.password;

    form.clearErrors('root');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      // Ensure user profile document exists
      const userDocRef = doc(firestore, 'users', loggedInUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const userRole = data.role === 'admin' ? 'Admin' : 'Salesman';
        // This only creates the user profile. It does NOT grant admin privileges.
        // Admin privileges must be granted manually in Firestore or by another admin
        // for the first admin user to prevent a security deadlock.
        await setDoc(userDocRef, {
          username: loggedInUser.email,
          role: userRole,
        });
      }

      router.push('/dashboard');
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/invalid-credential') {
        const detailedErrorMessage = `وشەی نهێنی یان ڕۆڵی هەڵبژێردراو هەڵەیە.\n\nبۆ چوونەژوورەوە، دڵنیابە ئەم هەژمارانە لە بەشی Authenticationی Firebase دروستکراون:\n\nبۆ ئەدمین:\nئیمەیڵ: admin@bedart.group\nوشەی نهێنی: Rawezh1818\n\nبۆ فرۆشیار:\nئیمەیڵ: salesman@bedart.group\nوشەی نهێنی: 123456`;
        form.setError('root', { message: detailedErrorMessage });
      } else {
         form.setError('root', { message: 'هەڵەیەکی چاوەڕواننەکراو ڕوویدا. تکایە دووبارە هەوڵبدەرەوە.' });
      }
    }
  };

  useEffect(() => {
      if (!isUserLoading && user) {
          router.replace('/dashboard');
      }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background/80" style={{ backgroundImage: 'url(https://picsum.photos/seed/login-bg/1920/1080)', backgroundSize: 'cover' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <BedDouble className="h-8 w-8 text-primary-foreground" />
                </div>
            </div>
          <CardTitle>BedArt Group</CardTitle>
          <CardDescription>تکایە ڕۆڵەکەت هەڵبژێرە و وشەی نهێنی بنووسە.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>من کێم؟</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex justify-around gap-4"
                      >
                        <Label
                          htmlFor="admin"
                          className={cn("relative flex-1 cursor-pointer rounded-md border-2 border-muted bg-popover p-4 transition-all hover:bg-accent hover:text-accent-foreground", field.value === 'admin' && 'border-primary')}
                        >
                          <RadioGroupItem value="admin" id="admin" className="peer sr-only" />
                          <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-primary opacity-0 transition-opacity duration-200 peer-aria-checked:opacity-100" />
                          ئەدمین
                        </Label>

                         <Label
                          htmlFor="salesman"
                          className={cn("relative flex-1 cursor-pointer rounded-md border-2 border-muted bg-popover p-4 transition-all hover:bg-accent hover:text-accent-foreground", field.value === 'salesman' && 'border-primary')}
                        >
                          <RadioGroupItem value="salesman" id="salesman" className="peer sr-only" />
                          <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-primary opacity-0 transition-opacity duration-200 peer-aria-checked:opacity-100" />
                          فرۆشیار
                        </Label>
                      </RadioGroup>
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
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="pl-10"
                          dir="ltr"
                          style={{ textAlign: 'left' }}
                        />
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
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md" dir="rtl">
                    <p className="font-bold mb-2 text-center">هەڵە لە چوونەژوورەوە</p>
                    <div className="space-y-2 text-right whitespace-pre-line">
                        {form.formState.errors.root.message}
                    </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {form.formState.isSubmitting ? '...چاوەڕوانبە' : 'چوونەژوورەوە'}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground flex justify-center">
            <p>بەکارهێنان تەنها بۆ کارمەندانە.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
