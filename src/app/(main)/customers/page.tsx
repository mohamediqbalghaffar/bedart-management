'use client';

import React, { use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2, Phone, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddCustomerForm } from "./components/add-customer-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WithId } from '@/firebase/firestore/use-collection';
import { ScrollArea } from '@/components/ui/scroll-area';

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
                    زیادکردنی کڕیار
                </Button>
            </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
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

    const { data: customers, isLoading } = useCollection<WithId<Customer>>(customersQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>لیستی کڕیارەکان</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <Table className="hidden md:table">
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
                                        <TableCell className="text-right">{customer.customerPhoneNumber || 'نەزانراو'}</TableCell>
                                        <TableCell className="text-right">{customer.customerAddress || 'نەزانراو'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="md:hidden space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                        ) : customers && customers.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">هیچ کڕیارێک تۆمار نەکراوە.</div>
                        ) : (
                            customers?.map((customer) => (
                                <Card key={customer.id} className="bg-card/80">
                                    <CardHeader>
                                        <CardTitle>{customer.customerName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>{customer.customerPhoneNumber || 'ژمارە تەلەفۆن نییە'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{customer.customerAddress || 'ناونیشان نییە'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function CustomersPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی کڕیارەکان" description="لیستی کڕیارەکانت لێرە ببینە و زیاد بکە.">
                <AddCustomerDialog />
            </PageHeader>
            <CustomersList />
        </div>
    );
}
