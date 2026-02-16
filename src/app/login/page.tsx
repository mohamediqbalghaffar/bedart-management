
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, useFirestore, doc, getDoc, setDoc, getDocs, collection } from '@/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { BedDouble, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Schemas for each login type
const adminLoginSchema = z.object({
  password: z.string().min(1, { message: 'تکایە وشەی نهێنی بنووسە.' }),
});
type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const salesmanLoginSchema = z.object({
  password: z.string().min(1, { message: 'تکایە وشەی نهێنی بنووسە.' }),
});
type SalesmanLoginFormValues = z.infer<typeof salesmanLoginSchema>;


// A generic login form component
function LoginForm({ role, schema, defaultPassword, instructionEmail, setIsProcessingLogin }: {
    role: 'Admin' | 'Salesman';
    schema: typeof adminLoginSchema | typeof salesmanLoginSchema;
    defaultPassword?: string;
    instructionEmail: string;
    setIsProcessingLogin: (isProcessing: boolean) => void;
}) {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            password: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof schema>) => {
        if (!auth || !firestore) {
            form.setError('root', { message: 'خزمەتگوزاری چوونەژوورەوە ئامادە نییە. تکایە دووبارە هەوڵبدەرەوە.' });
            return;
        }

        setIsProcessingLogin(true);

        const email = instructionEmail;
        const password = data.password;

        form.clearErrors('root');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user;

            const userDocRef = doc(firestore, 'users', loggedInUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            // Step 1: Ensure the user's profile document exists.
            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    username: loggedInUser.email,
                    role: role,
                });
            }

            // Step 2: If logging in as Admin, ensure the admin record exists.
            if (role === 'Admin') {
                const adminDocRef = doc(firestore, 'admins', loggedInUser.uid);
                const adminDocSnap = await getDoc(adminDocRef);

                if (!adminDocSnap.exists()) {
                    await setDoc(adminDocRef, { uid: loggedInUser.uid, isAdmin: true });
                }
            }

            // Navigation is now handled by the parent component's useEffect.
        } catch (error) {
            const authError = error as AuthError;
            // This error check specifically handles Firestore security rule failures during the admin doc creation.
            if (authError.code === 'permission-denied' || (error as any)?.message?.includes('PERMISSION_DENIED')) {
                 form.setError('root', { message: `Login successful, but failed to grant Admin privileges. Another admin may already exist. Contact support.` });
            } else if (authError.code === 'auth/invalid-credential') {
                const detailedErrorMessage = `وشەی نهێنی هەڵەیە.\n\nدڵنیابە ئەم هەژمارە لە بەشی Authenticationی Firebase دروستکراوە:\nئیمەیڵ: ${email}\nوشەی نهێنی پێشنیارکراو: ${defaultPassword}`;
                form.setError('root', { message: detailedErrorMessage });
            } else {
                form.setError('root', { message: 'هەڵەیەکی چاوەڕواننەکراو ڕوویدا. تکایە دووبارە هەوڵبدەرەوە.' });
            }
        } finally {
            setIsProcessingLogin(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
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
    );
}


export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  useEffect(() => {
      // Only redirect if a user exists AND we are not in the middle of the login form submission process.
      if (!isUserLoading && user && !isProcessingLogin) {
          router.replace('/dashboard');
      }
  }, [user, isUserLoading, router, isProcessingLogin]);

  // Updated loading condition
  if (isUserLoading || (user && !isProcessingLogin)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background/80 px-4" style={{ backgroundImage: 'url(https://picsum.photos/seed/login-bg/1920/1080)', backgroundSize: 'cover' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                    <BedDouble className="h-8 w-8 text-primary-foreground" />
                </div>
            </div>
          <CardTitle>BedArt Group</CardTitle>
          <CardDescription>تکایە جۆری هەژمارەکەت هەڵبژێرە و بچۆ ژوورەوە.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="admin" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="admin">ئەدمین</TabsTrigger>
                    <TabsTrigger value="salesman">فرۆشیار</TabsTrigger>
                </TabsList>
                <TabsContent value="admin" className="pt-4">
                    <LoginForm 
                        role="Admin" 
                        schema={adminLoginSchema}
                        defaultPassword="Rawezh1818"
                        instructionEmail="admin@bedart.group"
                        setIsProcessingLogin={setIsProcessingLogin}
                    />
                </TabsContent>
                <TabsContent value="salesman" className="pt-4">
                     <LoginForm 
                        role="Salesman" 
                        schema={salesmanLoginSchema}
                        defaultPassword="123456"
                        instructionEmail="salesman@bedart.group"
                        setIsProcessingLogin={setIsProcessingLogin}
                    />
                </TabsContent>
            </Tabs>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground flex justify-center">
            <p>بەکارهێنان تەنها بۆ کارمەندانە.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
