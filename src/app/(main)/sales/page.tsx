
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { SalesDetails } from './components/sales-details';

// Matches the structure in backend.json for SellingForm
type SellingFormType = {
    customerName: string;
    issueDate: string;
    totalPrice: number;
    paymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
    formNumber: string;
};

function SalesList() {
    const firestore = useFirestore();

    const sellingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'selling_forms');
    }, [firestore]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<SellingFormType>(sellingFormsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>فرۆشەکانی ئەم دواییە</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ژ. فۆڕم</TableHead>
                            <TableHead>کڕیار</TableHead>
                            <TableHead>بەروار</TableHead>
                            <TableHead>بڕ</TableHead>
                            <TableHead>بارودۆخ</TableHead>
                            <TableHead className="text-left">کردارەکان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingSales ? (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : !sales || sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">هیچ فرۆشێک تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">{sale.formNumber}</TableCell>
                                <TableCell>{sale.customerName}</TableCell>
                                <TableCell>{sale.issueDate}</TableCell>
                                <TableCell>{new Intl.NumberFormat('en-US').format(sale.totalPrice || 0)}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={sale.paymentStatus === 'Fully Paid' ? 'default' : sale.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'} 
                                        className={sale.paymentStatus === 'Fully Paid' ? 'bg-accent text-accent-foreground' : ''}
                                    >
                                        {sale.paymentStatus === 'Fully Paid' ? 'هەمووی دراوە' : sale.paymentStatus === 'Partially Paid' ? 'بەشێکی دراوە' : 'نەدراوە'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-left">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <FileSpreadsheet className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl" dir="rtl">
                                            <DialogHeader>
                                                <DialogTitle>وردەکارییەکانی فۆڕمی فرۆشتن</DialogTitle>
                                            </DialogHeader>
                                            <SalesDetails formId={sale.id} />
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function SalesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="فرۆشەکان" description="بەڕێوەبردن و بەدواداچوونی هەموو کارەکانی فرۆشتنت.">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            دروستکردنی فۆڕمی فرۆشتن
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <div className="text-center p-4">
                                <DialogTitle className="text-2xl font-bold">BedArt Group</DialogTitle>
                                <DialogDescription className="text-sm">
                                    ته ختی نوستن . دوشک . پشتی
                                    <br />
                                    <span className="text-xs text-muted-foreground">0770 817 1818 - 0770 077 1818</span>
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto p-2">
                          <SalesForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <SalesList />
        </div>
    );
}
