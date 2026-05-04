'use client';

import React, { useState, useMemo, use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PlusCircle, ArrowUpDown } from "lucide-react";
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
    const [sortConfig, setSortConfig] = useState<{ key: keyof Expense; direction: 'ascending' | 'descending' } | null>(null);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'expenses');
    }, [firestore, refreshKey]);

    const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);
    
    const handleExpenseChange = () => {
        setRefreshKey(prev => prev + 1);
    }

    const sortedExpenses = useMemo(() => {
        if (!expenses) return [];
        let sortableItems = [...expenses];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || bValue === undefined) return 0;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [expenses, sortConfig]);

    const requestSort = (key: keyof Expense) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof Expense) => (
        <ArrowUpDown className={`mr-2 h-4 w-4 inline-block ${sortConfig?.key === key ? 'text-primary' : 'text-muted-foreground'}`} />
    );

    return (
        <Card className="flex flex-col h-full border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle>لیستی خەرجییەکان</CardTitle>
                    <div className="mt-4 md:mt-0">
                         <AddExpenseDialog onExpenseAdded={handleExpenseChange} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 md:p-6 pt-0">
                <ScrollArea className="h-full overflow-y-auto pr-4">
                     <Table className="hidden md:table relative">
                        <TableHeader className="sticky top-0 z-20 bg-card shadow-sm">
                            <TableRow>
                                <TableHead className="w-[20%] text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('name')}>
                                    {getSortIcon('name')} ناوی خەرجی
                                </TableHead>
                                <TableHead className="w-[20%] text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('note')}>
                                    {getSortIcon('note')} تێبینی
                                </TableHead>
                                <TableHead className="w-[20%] text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('amount')}>
                                    {getSortIcon('amount')} بڕ
                                </TableHead>
                                <TableHead className="w-[15%] text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('category')}>
                                    {getSortIcon('category')} پۆل
                                </TableHead>
                                <TableHead className="w-[15%] text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('date')}>
                                    {getSortIcon('date')} بەروار
                                </TableHead>
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
                            ) : sortedExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">هیچ خەرجییەک تۆمار نەکراوە.</TableCell>
                                </TableRow>
                            ) : (
                                sortedExpenses.map((expense) => (
                                    <EditableExpenseRow key={expense.id} expense={expense} onExpenseUpdated={handleExpenseChange} mode="table" />
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="md:hidden space-y-2 p-1">
                        {isLoading ? (
                           <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                        ) : sortedExpenses.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">هیچ خەرجییەک تۆمار نەکراوە.</div>
                        ) : (
                             sortedExpenses.map((expense) => (
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
        <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-8 pt-4 space-y-4 overflow-hidden" dir="rtl">
            <PageHeader title="بەڕێوەبردنی خەرجییەکان" description="تۆماری خەرجییەکانت لێرە ببینە و زیاد بکە." />
            <div className="flex-1 overflow-hidden">
                <ExpensesList />
            </div>
        </div>
    );
}
