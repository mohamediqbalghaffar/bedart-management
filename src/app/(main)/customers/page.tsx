
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddCustomerForm } from "./components/add-customer-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Customer = {
    customerName: string;
    customerPhoneNumber?: string;
    customerAddress?: string;
};

function AddCustomerDialog() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                        زانیارییەکانی کڕیاری نوێ بنووسە. 
                    </DialogDescription>
                </DialogHeader>
                <AddCustomerForm onCustomerAdded={() => setIsDialogOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function CustomersList() {
    const firestore = useFirestore();

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);

    const { data: customers, isLoading } = useCollection<Customer>(customersQuery);

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
                        ) : customers && customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">هیچ کڕیارێک تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            customers?.map((customer) => (
                                <TableRow key={customer.id}>
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
                <AddCustomerDialog />
            </PageHeader>
            <CustomersList />
        </div>
    );
}
