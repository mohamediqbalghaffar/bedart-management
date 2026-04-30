'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2, Save, X } from 'lucide-react';
import { useFirestore, doc, updateDoc, deleteDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { WithId } from '@/firebase/firestore/use-collection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { format, parseISO } from 'date-fns';
import { ConfidentialBlur } from '@/components/shared/confidential-blur';
import { DatePicker } from "@/components/ui/date-picker";

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

export function EditableExpenseRow({ expense, onExpenseUpdated, mode = 'table' }: { expense: WithId<Expense>, onExpenseUpdated: () => void, mode?: 'table' | 'card' }) {
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
        if (mode === 'card') {
            return (
                <Card className="md:hidden">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                            <CardHeader>
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>ناوی خەرجی</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="note" render={({ field }) => ( <FormItem> <FormLabel>تێبینی</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <div className="flex gap-4">
                                    <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem className="flex-grow"> <FormLabel>بڕ</FormLabel> <FormControl><Input type="number" {...field} step="0.01" /></FormControl> <FormMessage /> </FormItem> )}/>
                                    <FormField control={form.control} name="currency" render={({ field }) => (
                                        <FormItem className="w-[100px]">
                                            <FormLabel>دراو</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="IQD">IQD</SelectItem></SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>پۆل</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>{Object.entries(categoryTranslations).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="date" render={({ field }) => ( <FormItem> <FormLabel>بەروار</FormLabel> <FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl> <FormMessage /> </FormItem> )}/>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 mr-2 text-muted-foreground"/>پاشگەزبوونەوە</Button>
                                <Button size="sm" onClick={form.handleSubmit(handleSave)} disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2 text-primary-foreground"/>}
                                    پاشەکەوت
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            );
        }

        return (
            <Form {...form}>
                <TableRow className="bg-secondary/20 hidden md:table-row">
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
                    <TableCell><FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
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

    if (mode === 'card') {
        return (
            <Card key={`${expense.id}-mobile`} className="md:hidden">
                <CardHeader>
                    <CardTitle>{expense.name}</CardTitle>
                    <CardDescription>{format(parseISO(expense.date), "yyyy-MM-dd")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">بڕ:</span>
                        <ConfidentialBlur><span className="font-semibold">{currencyFormatter.format(expense.amount)}</span></ConfidentialBlur>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">پۆل:</span>
                        <Badge variant="outline">{categoryTranslations[expense.category] || expense.category}</Badge>
                    </div>
                     {expense.note && <div className="flex justify-between">
                        <span className="text-muted-foreground">تێبینی:</span>
                        <span>{expense.note}</span>
                    </div>}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                     <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2 text-blue-500"/>دەستکاری</Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 mr-2 text-destructive" />سڕینەوە</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>ئایا دڵنیایت لە سڕینەوەی ئەم خەرجییە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە و ناتوانیت بیگەڕێنیتەوە.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">بەڵێ, بسڕەوە</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        );
    }

    return (
        <TableRow key={expense.id} className="hidden md:table-row">
            <TableCell className="font-medium text-right">{expense.name}</TableCell>
            <TableCell className="text-right">{expense.note || '---'}</TableCell>
            <TableCell className="text-right"><ConfidentialBlur>{currencyFormatter.format(expense.amount)}</ConfidentialBlur></TableCell>
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
