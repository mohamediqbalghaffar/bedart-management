'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddExpenseTableRow } from './components/add-expense-table-row';
import { EditableExpenseRow } from './components/editable-expense-row';


type Expense = {
    name: string;
    note?: string;
    amount: number;
    currency?: 'USD' | 'IQD';
    category: 'Daily' | 'Salary' | 'Rent' | 'Electricity' | 'Transport' | 'Other';
    date: string;
};

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
                <CardTitle>لیستی خەرجییەکان</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
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
                                <EditableExpenseRow key={expense.id} expense={expense} onExpenseUpdated={handleExpenseChange} />
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
            <PageHeader title="بەڕێوەبردنی خەرجییەکان" description="تۆماری خەرجییەکانت لێرە ببینە و زیاد بکە." />
            <ExpensesList />
        </div>
    );
}