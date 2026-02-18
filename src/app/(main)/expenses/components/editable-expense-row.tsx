'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2, Save, X } from 'lucide-react';
import { useFirestore, doc, updateDoc, deleteDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { WithId } from '@/firebase/firestore/use-collection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { format, parseISO } from 'date-fns';

type Expense = {
    name: string;
    note?: string;
    amount: number;
    currency?: 'USD' | 'IQD';
    category: 'Daily' | 'Salary' | 'Rent' | 'Electricity' | 'Transport' | 'Other';
    date: string;
};

const expenseSchema = z.object({
  name: z.string().min(1, { message: "پێویستە." }),
  note: z.string().optional(),
  amount: z.coerce.number().min(0.01, "پێویستە."),
  currency: z.enum(['USD', 'IQD']),
  category: z.enum(['Daily', 'Salary', 'Rent', 'Electricity', 'Transport', 'Other']),
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی هەڵە." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;


const categoryTranslations: { [key: string]: string } = {
    'Daily': 'ڕۆژانە', 'Salary': 'مووچە', 'Rent': 'کرێ', 'Electricity': 'کارەبا', 'Transport': 'گواستنەوە', 'Other': 'هەمەجۆر'
};

export function EditableExpenseRow({ expense, onExpenseUpdated }: { expense: WithId<Expense>, onExpenseUpdated: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            ...expense,
            date: format(parseISO(expense.date), "yyyy-MM-dd"), // Ensure date is in correct format for input type="date"
        },
    });

    const handleSave = async (data: ExpenseFormValues) => {
        if (!firestore) return;
        try {
            const expenseRef = doc(firestore, "expenses", expense.id);
            await updateDoc(expenseRef, data);
            toast({ title: "سەرکەوتوو بوو", description: "خەرجییەکە نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
            setIsEditing(false);
            onExpenseUpdated();
        } catch (error) {
            console.error("Error updating expense:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوەکە سەرکەوتوو نەبوو." });
        }
    };
    
    const handleDelete = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "expenses", expense.id));
            toast({ title: "سەرکەوتوو بوو", description: "خەرجییەکە سڕایەوە.", className: "bg-accent text-accent-foreground" });
            // onExpenseUpdated will trigger a re-render from the parent
            onExpenseUpdated();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەکە سەرکەوتوو نەبوو." });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency || 'USD' });

    if (isEditing) {
        return (
            <Form {...form}>
                <TableRow className="bg-secondary/20">
                    <TableCell><FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
                    <TableCell><FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem className="flex-grow"><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="currency" render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                        <FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="IQD">IQD</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                    </TableCell>
                    <TableCell>
                            <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{Object.entries(categoryTranslations).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </TableCell>
                    <TableCell><FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
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
        <TableRow key={expense.id}>
            <TableCell className="font-medium text-right">{expense.name}</TableCell>
            <TableCell className="text-right">{expense.note || '---'}</TableCell>
            <TableCell className="text-right">{currencyFormatter.format(expense.amount)}</TableCell>
            <TableCell className="text-right"><Badge variant="outline">{categoryTranslations[expense.category] || expense.category}</Badge></TableCell>
            <TableCell className="text-right">{format(parseISO(expense.date), "yyyy-MM-dd")}</TableCell>
            <TableCell className="text-left">
                <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 text-blue-500"/></Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>ئایا دڵنیایت لە سڕینەوەی ئەم خەرجییە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە و ناتوانیت بیگەڕێنیتەوە.</AlertDialogDescription></AlertDialogHeader>
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