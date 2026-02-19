'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Loader2, Edit, Trash2, Save, X } from 'lucide-react';
import { useFirestore, doc, updateDoc, deleteDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { WithId } from '@/firebase/firestore/use-collection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

type User = {
    name: string;
    role: 'Admin' | 'Data Manager' | 'Salesman';
    code: string;
};

const userSchema = z.object({
  name: z.string().min(1, { message: "پێویستە." }),
  role: z.enum(['Admin', 'Data Manager', 'Salesman']),
  code: z.string().min(1, "پێویستە."),
});

type UserFormValues = z.infer<typeof userSchema>;

export function EditableUserRow({ user, onUserChanged }: { user: WithId<User>, onUserChanged: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: user,
    });

    const handleSave = async (data: UserFormValues) => {
        if (!firestore) return;
        try {
            const userRef = doc(firestore, "users", user.id);
            await updateDoc(userRef, data);
            toast({ title: "سەرکەوتوو بوو", description: "بەکارهێنەر نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
            setIsEditing(false);
            onUserChanged();
        } catch (error) {
            console.error("Error updating user:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوەکە سەرکەوتوو نەبوو." });
        }
    };
    
    const handleDelete = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "users", user.id));
            toast({ title: "سەرکەوتوو بوو", description: "بەکارهێنەرەکە سڕایەوە.", className: "bg-accent text-accent-foreground" });
            onUserChanged();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەکە سەرکەوتوو نەبوو." });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (isEditing) {
        return (
            <Form {...form}>
                <TableRow className="bg-secondary/20">
                    <TableCell><FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
                    <TableCell>
                        <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Admin">بەڕێوەبەر</SelectItem>
                                        <SelectItem value="Data Manager">داتا مانجەر</SelectItem>
                                        <SelectItem value="Salesman">فرۆشیار</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </TableCell>
                    <TableCell className="text-left">
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={form.handleSubmit(handleSave)} disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 text-primary"/>}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 text-muted-foreground"/></Button>
                        </div>
                    </TableCell>
                </TableRow>
            </Form>
        );
    }

    return (
        <TableRow key={user.id}>
            <TableCell className="font-medium text-right">{user.name}</TableCell>
            <TableCell className="text-right">{user.role}</TableCell>
            <TableCell className="text-left">
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 text-blue-500"/></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">بەڵێ, بسڕەوە</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
        </TableRow>
    );
}
