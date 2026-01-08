
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { AddExpenseForm } from "./components/add-expense-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Expense = {
    name: string;
    note?: string;
    paidBy: string;
    amount: number;
    category: string;
    date: string;
};

function ExpensesList() {
    const firestore = useFirestore();

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'expenses');
    }, [firestore]);

    const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);
    
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
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
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium text-right">{expense.name}</TableCell>
                                    <TableCell className="text-right">{expense.note || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{paidByTranslations[expense.paidBy] || expense.paidBy}</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('en-US').format(expense.amount)}</TableCell>
                                    <TableCell className="text-right">
                                         <Badge variant="outline">{categoryTranslations[expense.category] || expense.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{expense.date}</TableCell>
                                </TableRow>
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
            <PageHeader title="خەرجییەکان" description="بەدواداچوون بۆ هەموو خەرجییەکانی کارەکەت بکە، جێگیر و گۆڕاو.">
                {/* Button is now part of the Collapsible trigger, handled inside the Collapsible component */}
            </PageHeader>
            
            <Collapsible>
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
                             <AddExpenseForm />
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
            
            <ExpensesList />
        </div>
    );
}
