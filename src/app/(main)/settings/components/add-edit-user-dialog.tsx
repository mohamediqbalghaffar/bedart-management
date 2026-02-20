'use client';

import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, doc, collection, setDoc, updateDoc } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, Edit } from "lucide-react";
import { WithId } from "@/firebase/firestore/use-collection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type User = {
    id: string;
    name: string;
    role: 'Admin' | 'Data Manager' | 'Salesman';
    code: string;
    photoURL?: string;
};

const userSchema = z.object({
  name: z.string().min(1, { message: "ناوی بەکارهێنەر پێویستە." }),
  role: z.enum(['Admin', 'Data Manager', 'Salesman'], { required_error: "ڕۆڵ پێویستە."}),
  code: z.string().optional(),
  photoURL: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

type AddEditUserDialogProps = {
    children: React.ReactNode;
    user?: WithId<User>;
    onUserChanged: () => void;
};


export function AddEditUserDialog({ children, user, onUserChanged }: AddEditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();
    const isEditMode = !!user;

    const [imagePreview, setImagePreview] = useState<string | null>(isEditMode ? user.photoURL || null : null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: isEditMode ? { name: user.name, role: user.role, photoURL: user.photoURL } : {
            name: "",
            role: "Salesman",
            code: "",
            photoURL: "",
        },
    });

    useEffect(() => {
        if (open) {
            const defaultVals = isEditMode 
                ? { name: user.name, role: user.role, photoURL: user.photoURL } 
                : { name: "", role: "Salesman" as const, code: "", photoURL: "" };
            form.reset(defaultVals);
            setImagePreview(isEditMode ? user.photoURL || null : null);
        }
    }, [open, user, isEditMode, form]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadstart = () => setIsUploading(true);
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                form.setValue('photoURL', reader.result as string);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };


    async function onSubmit(data: UserFormValues) {
        if (!firestore) {
            toast({
                variant: "destructive",
                title: "هەڵەیەک ڕوویدا",
                description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
            });
            return;
        }

        try {
            if (isEditMode) {
                const userRef = doc(firestore, 'users', user.id);
                const updateData: Partial<User> = { name: data.name, role: data.role };
                if (data.code) {
                    updateData.code = data.code;
                }
                if (data.photoURL) {
                    updateData.photoURL = data.photoURL;
                }
                await updateDoc(userRef, updateData);
                toast({ title: "سەرکەوتوو بوو!", description: "بەکارهێنەر نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
            } else {
                if (!data.code) {
                    form.setError("code", { message: "کۆدی نهێنی پێویستە." });
                    return;
                }
                const userRef = doc(collection(firestore, 'users'));
                const newUserData = { ...data, id: userRef.id, photoURL: form.getValues('photoURL') || "" };
                await setDoc(userRef, newUserData);
                toast({ title: "سەرکەوتوو بوو!", description: "بەکارهێنەری نوێ زیادکرا.", className: "bg-accent text-accent-foreground" });
            }
            form.reset();
            onUserChanged();
            setOpen(false);

        } catch (error) {
            console.error("Error saving user:", error);
            toast({ variant: 'destructive', title: "هەڵە", description: "پاشەکەوتکردنی بەکارهێنەر سەرکەوتوو نەبوو." });
        }
    }
    
     const roleTranslations: Record<User['role'], string> = {
        'Admin': 'بەڕێوەبەر',
        'Data Manager': 'داتا مانجەر',
        'Salesman': 'فرۆشیار'
    };
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'دەستکاریکردنی بەکارهێنەر' : 'بەکارهێنەری نوێ'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'زانیارییەکانی بەکارهێنەر نوێ بکەرەوە.' : 'زانیارییەکانی بەکارهێنەری نوێ بنووسە.'}
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
                         <div className="flex justify-center pt-4">
                            <div className="relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <Avatar className="h-24 w-24 cursor-pointer border-2 border-dashed border-muted-foreground/50" onClick={() => fileInputRef.current?.click()}>
                                    <AvatarImage src={imagePreview || undefined} alt={form.getValues('name')} />
                                    <AvatarFallback className="text-3xl bg-secondary">
                                        {isUploading ? <Loader2 className="h-8 w-8 animate-spin"/> : getInitials(form.watch('name')) || <Camera />}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Edit className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ناوی بەکارهێنەر</FormLabel>
                            <FormControl>
                                <Input placeholder="ناوی تەواو" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ڕۆڵ</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(roleTranslations).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{isEditMode ? 'کۆدی نهێنی نوێ (ئارەزوومەندانە)' : 'کۆدی نهێنی'}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                            {form.formState.isSubmitting ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />...پاشەکەوت دەکرێت</> : (isEditMode ? 'پاشەکەوتکردنی گۆڕانکاری' : 'دروستکردنی بەکارهێنەر')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
