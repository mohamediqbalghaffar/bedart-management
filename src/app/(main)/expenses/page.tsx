
'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, Edit, Trash2, Save, X } from "lucide-react";
import { AddExpenseForm } from "./components/add-expense-form";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, updateDoc, deleteDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';
import { format } from 'date-fns-jalali';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type Expense = {
    name: string;
    note?: string;
    paidBy: 'Cash - Dinar' | 'Cash - Dollar';
    amount: number;
    category: 'Daily' | 'Salary' | 'Rent' | 'Electricity' | 'Transport' | 'Other';
    date: string;
};

const categoryTranslations: { [key: string]: string } = {
    'Daily': 'ڕۆژانە',
    'Salary': 'مووچە',
    'Rent': 'کرێ',
    'Electricity': 'کارەبا',
    'Transport': 'گواستنەوە',
    'Other': 'هەمەجۆر'
};

const paidByTranslations: { [key: string]: string } = {
    'Cash - Dinar': 'کاش - دینار',
    'Cash - Dollar': 'کاش - دۆلار'
};

function AddExpenseCollapsible() {
    const [open, setOpen] = useState(false);
    
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex justify-start mb-4">
                <CollapsibleTrigger asChild>
                    <Button>
                        <PlusCircle />
                        زیادکردنی خەرجی
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>خەرجی نوێ زیاد بکە</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AddExpenseForm onExpenseAdded={() => setOpen(false)} />
                    </CardContent>
                </Card>
            </CollapsibleContent>
        </Collapsible>
    );
}

function EditableExpenseRow({ expense }: { expense: WithId<Expense> }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedExpense, setEditedExpense] = useState(expense);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedExpense(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (name: keyof Expense, value: string) => {
        setEditedExpense(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setEditedExpense(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
        }
    };

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            const expenseRef = doc(firestore, "expenses", expense.id);
            const { id, ...dataToSave } = editedExpense;
            await updateDoc(expenseRef, dataToSave);
            toast({ title: "سەرکەوتوو بوو", description: "خەرجییەکە نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating expense:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوە سەرکەوتوو نەبوو." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "expenses", expense.id));
            toast({ title: "سەرکەوتوو بوو", description: "خەرجییەکە سڕایەوە.", className: "bg-accent text-accent-foreground" });
            // The component will be unmounted by the parent's re-render
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "srinewe serkewtu nebu." });
            setIsDeleting(false);
        }
    };

    if (isEditing) {
        return (
            <TableRow className="bg-secondary/20">
                <TableCell><Input name="name" value={editedExpense.name} onChange={handleInputChange} /></TableCell>
                <TableCell><Input name="note" value={editedExpense.note || ''} onChange={handleInputChange} /></TableCell>
                <TableCell>
                    <Select value={editedExpense.paidBy} onValueChange={(value) => handleSelectChange('paidBy', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(paidByTranslations).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell><Input type="number" name="amount" value={editedExpense.amount} onChange={handleInputChange} /></TableCell>
                <TableCell>
                    <Select value={editedExpense.category} onValueChange={(value) => handleSelectChange('category', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(categoryTranslations).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="ml-2 h-4 w-4" /><span>{format(parseISO(editedExpense.date), "PPP")}</span></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" dir="rtl"><Calendar mode="single" selected={parseISO(editedExpense.date)} onSelect={handleDateChange} initialFocus /></PopoverContent>
                    </Popover>
                </TableCell>
                <TableCell className="text-left">
                    <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 text-primary"/>}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 text-muted-foreground"/></Button>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow key={expense.id}>
            <TableCell className="font-medium text-right">{expense.name}</TableCell>
            <TableCell className="text-right">{expense.note || 'N/A'}</TableCell>
            <TableCell className="text-right">{paidByTranslations[expense.paidBy] || expense.paidBy}</TableCell>
            <TableCell className="text-right">{new Intl.NumberFormat('en-US').format(expense.amount)}</TableCell>
            <TableCell className="text-right"><Badge variant="outline">{categoryTranslations[expense.category] || expense.category}</Badge></TableCell>
            <TableCell className="text-right">{format(parseISO(expense.date), "PPP")}</TableCell>
            <TableCell className="text-left">
                <div className="flex gap-2">
                     <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 text-blue-500"/></Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button size="icon" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>دڵنیایت لە سڕینەوە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">بەڵێ، بسڕەوە</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
        </TableRow>
    );
}

function ExpensesList() {
    const firestore = useFirestore();

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'expenses');
    }, [firestore]);

    const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>لیستی خەرجییەکان</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ناوی خەرجی</TableHead>
                            <TableHead className="text-right">تێبینی</TableHead>
                            <TableHead className="text-right">شێوازی پارەدان</TableHead>
                            <TableHead className="text-right">بڕ</TableHead>
                            <TableHead className="text-right">پۆل</TableHead>
                            <TableHead className="text-right">بەروار</TableHead>
                            <TableHead className="text-left">کردارەکان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : !expenses || expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">هیچ خەرجییەک تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <EditableExpenseRow key={expense.id} expense={expense} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function ExpensesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="خەرجییەکان" description="بەدواداچوون بۆ هەموو خەرجییەکانی کارەکەت بکە، جێگیر و گۆڕاو." />
            <AddExpenseCollapsible />
            <ExpensesList />
        </div>
    );
}

    

    