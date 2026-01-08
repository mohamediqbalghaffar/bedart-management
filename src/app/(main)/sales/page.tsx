
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileSpreadsheet, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDocumentNonBlocking, doc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { SalesDetails } from './components/sales-details';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();

    const sellingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'selling_forms');
    }, [firestore]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<SellingFormType>(sellingFormsQuery);

    const handleDelete = async (formId: string) => {
        if (!firestore) return;
        try {
            // Note: This only deletes the main sales form. For a production app, 
            // you'd ideally use a Cloud Function to also delete products in the subcollection
            // and adjust inventory levels. For simplicity here, we only delete the form document.
            await deleteDocumentNonBlocking(doc(firestore, 'selling_forms', formId));
            toast({
                title: "سەرکەوتوو بوو",
                description: "فۆڕمی فرۆشتن بە سەرکەوتوویی سڕایەوە.",
                className: "bg-accent text-accent-foreground",
            });
        } catch (error) {
            console.error("Error deleting sales form:", error);
            toast({
                variant: 'destructive',
                title: "هەڵەیەک ڕوویدا",
                description: "سڕینەوەی فۆڕمی فرۆشتن سەرکەوتوو نەبوو.",
            });
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>فرۆشەکانی ئەم دواییە</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">ژ. فۆڕم</TableHead>
                            <TableHead className="text-center">کڕیار</TableHead>
                            <TableHead className="text-center">بەروار</TableHead>
                            <TableHead className="text-center">بڕ</TableHead>
                            <TableHead className="text-center">بارودۆخ</TableHead>
                            <TableHead className="text-center">کردارەکان</TableHead>
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
                                <TableCell className="font-medium text-center">{sale.formNumber}</TableCell>
                                <TableCell className="text-center">{sale.customerName}</TableCell>
                                <TableCell className="text-center">{sale.issueDate}</TableCell>
                                <TableCell className="text-center">{new Intl.NumberFormat('en-US').format(sale.totalPrice || 0)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge 
                                        variant={sale.paymentStatus === 'Fully Paid' ? 'default' : sale.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'} 
                                        className={sale.paymentStatus === 'Fully Paid' ? 'bg-accent text-accent-foreground' : ''}
                                    >
                                        {sale.paymentStatus === 'Fully Paid' ? 'هەمووی دراوە' : sale.paymentStatus === 'Partially Paid' ? 'بەشێکی دراوە' : 'نەدراوە'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                     <div className="flex items-center justify-center gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>دڵنیایت لە سڕینەوە؟</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        ئەم کردارە پاشگەزبوونەوەی نییە. ئەمە بە هەمیشەیی فۆڕمەکە دەسڕێتەوە.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(sale.id)} className="bg-destructive hover:bg-destructive/90">
                                                        بەڵێ، بسڕەوە
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
                                    </div>
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
