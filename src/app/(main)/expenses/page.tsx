'use client';

import React, { useState, useMemo, use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PlusCircle } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddExpenseTableRow } from './components/add-expense-table-row';
import { EditableExpenseRow } from './components/editable-expense-row';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AddExpenseForm } from './components/add-expense-form';


type Expense = {
    name: string;
    note?: string;
    amount: number;
    currency?: 'USD' | 'IQD';
    category: 'Daily' | 'Salary' | 'Rent' | 'Electricity' | 'Transport' | 'Other';
    date: string;
};

function AddExpenseDialog({ onExpenseAdded }: { onExpenseAdded: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="md:hidden">
                    <PlusCircle />
                    زیادکردنی خەرجی
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>خەرجی نوێ زیاد بکە</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی خەرجی نوێ بنووسە.
                    </DialogDescription>
                </DialogHeader>
                <AddExpenseForm onExpenseAdded={() => { onExpenseAdded(); setOpen(false); }} />
            </DialogContent>
        </Dialog>
    );
}

function ExpensesList() {
    const firestore = useFirestore();
    const [refreshKey, setRefreshKey] = useState(0);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'expenses');
    }, [firestore, refreshKey]);

    const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);
    
    const handleExpenseChange = () => {
        setRefreshKey(prev => prev + 1);
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle>لیستی خەرجییەکان</CardTitle>
                    <div className="mt-4 md:mt-0">
                         <AddExpenseDialog onExpenseAdded={handleExpenseChange} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                     <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20%] text-right">ناوی خەرجی</TableHead>
                                <TableHead className="w-[20%] text-right">تێبینی</TableHead>
                                <TableHead className="w-[20%] text-right">بڕ</TableHead>
                                <TableHead className="w-[15%] text-right">پۆل</TableHead>
                                <TableHead className="w-[15%] text-right">بەروار</TableHead>
                                <TableHead className="w-[10%] text-left">کردارەکان</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AddExpenseTableRow onExpenseAdded={handleExpenseChange} />
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : !expenses || expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">هیچ خەرجییەک تۆمار نەکراوە.</TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <EditableExpenseRow key={expense.id} expense={expense} onExpenseUpdated={handleExpenseChange} mode="table" />
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="md:hidden space-y-4">
                        {isLoading ? (
                           <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                        ) : !expenses || expenses.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">هیچ خەرجییەک تۆمار نەکراوە.</div>
                        ) : (
                             expenses.map((expense) => (
                                <EditableExpenseRow key={expense.id} expense={expense} onExpenseUpdated={handleExpenseChange} mode="card" />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function ExpensesPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی خەرجییەکان" description="تۆماری خەرجییەکانت لێرە ببینە و زیاد بکە." />
            <ExpensesList />
        </div>
    );
}
