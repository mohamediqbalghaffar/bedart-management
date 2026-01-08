
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddCustomerForm } from "./components/add-customer-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// This should align with the implicit customer data in SellingForm
type Customer = {
    customerName: string;
    customerPhoneNumber?: string;
    customerAddress?: string;
};

function CustomersList() {
    const firestore = useFirestore();

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // There is no dedicated customers collection. We derive customers from selling_forms.
        // For a real app, a `customers` collection would be better.
        // This is a simplified approach to show *some* data.
        return collection(firestore, 'selling_forms');
    }, [firestore]);

    const { data: sellingForms, isLoading } = useCollection<{ customerName: string; customerPhoneNumber?: string; customerAddress?: string }>(customersQuery);

    const customers = React.useMemo(() => {
        if (!sellingForms) return [];
        const customerMap = new Map<string, Customer>();
        sellingForms.forEach(form => {
            if (form.customerName && !customerMap.has(form.customerName.toLowerCase())) {
                customerMap.set(form.customerName.toLowerCase(), {
                    customerName: form.customerName,
                    customerPhoneNumber: form.customerPhoneNumber,
                    customerAddress: form.customerAddress
                });
            }
        });
        return Array.from(customerMap.values());
    }, [sellingForms]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>لیستی کڕیارەکان</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ناوی کڕیار</TableHead>
                            <TableHead className="text-right">ژمارەی تەلەفۆن</TableHead>
                            <TableHead className="text-right">ناونیشان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">هیچ کڕیارێک تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.customerName}>
                                    <TableCell className="font-medium text-right">{customer.customerName}</TableCell>
                                    <TableCell className="text-right">{customer.customerPhoneNumber || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{customer.customerAddress || 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function CustomersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="کڕیارەکان" description="لیستی کڕیارەکان و مێژوویان بەڕێوەببە.">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            زیادکردنی کڕیar
                        </Button>
                    </DialogTrigger>
                     <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>کڕیاری نوێ زیاد بکە</DialogTitle>
                            <DialogDescription>
                                زانیارییەکانی کڕیاری نوێ بنووسە. کڕیارەکان بە شێوەیەکی ئۆتۆماتیکیش زیاد دەبن لە کاتی دروستکردنی فۆڕمی فرۆشتن.
                            </DialogDescription>
                        </DialogHeader>
                        <AddCustomerForm />
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <CustomersList />
        </div>
    );
}
