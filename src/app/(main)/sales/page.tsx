'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileSpreadsheet, Trash2, Edit, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc, getDocs, runTransaction, useDoc } from '@/firebase';
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

type SellingFormProduct = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
};

type CompanyInfo = {
    name: string;
    contact: string;
}

function SalesFormDialog({ formId, onSave, trigger }: { formId: string | null, onSave: () => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const firestore = useFirestore();

    const companyInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'app_settings', 'companyInfo') : null), [firestore]);
    const { data: companyInfo, isLoading: isLoadingInfo } = useDoc<CompanyInfo>(companyInfoRef);

    const renderHeader = () => {
        if (isLoadingInfo) {
            return (
                <div className="space-y-2">
                    <div className="h-7 w-48 mx-auto bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded-md" />
                    <div className="h-3 w-40 mx-auto bg-muted animate-pulse rounded-md" />
                </div>
            )
        }

        const title = companyInfo?.name || 'BedArt Group';
        const contact = companyInfo?.contact || 'ته ختی نوستن . دوشک . پشتی\n07708171818 - 07700771818';
        const contactParts = contact.split('\n');

        return (
            <>
                <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                <DialogDescription className="text-sm">
                    {contactParts[0]}
                    {contactParts.length > 1 && <br />}
                    {contactParts.length > 1 && <span className="text-xs text-muted-foreground">{contactParts.slice(1).join('\n')}</span>}
                </DialogDescription>
            </>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-4xl" dir="rtl">
                <DialogHeader>
                    <div className="text-center p-4">
                        {renderHeader()}
                    </div>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto p-2">
                    <SalesForm formId={formId} onSave={() => { onSave(); setOpen(false); }} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SalesList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingFormId, setEditingFormId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: keyof SellingFormType; direction: 'ascending' | 'descending' } | null>(null);

    const sellingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // The refreshKey is added to re-trigger the query when a sale is added/edited
        return collection(firestore, 'selling_forms');
    }, [firestore, refreshKey]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<SellingFormType>(sellingFormsQuery);

    const sortedSales = useMemo(() => {
        if (!sales) return [];
        let sortableItems = [...sales];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                // Special handling for formNumber as it's a string that should be numeric
                if (sortConfig.key === 'formNumber') {
                    const numA = parseInt(String(aValue), 10);
                    const numB = parseInt(String(bValue), 10);
                    if (isNaN(numA) || isNaN(numB)) {
                        // fallback to string compare if parsing fails
                         if (String(aValue) < String(bValue)) return sortConfig.direction === 'ascending' ? -1 : 1;
                         if (String(aValue) > String(bValue)) return sortConfig.direction === 'ascending' ? 1 : -1;
                         return 0;
                    }
                     if (numA < numB) return sortConfig.direction === 'ascending' ? -1 : 1;
                     if (numA > numB) return sortConfig.direction === 'ascending' ? 1 : -1;
                     return 0;
                }

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
    }, [sales, sortConfig]);

    const requestSort = (key: keyof SellingFormType) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof SellingFormType) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />;
        }
        return <ArrowUpDown className="mr-2 h-4 w-4 text-primary" />;
    };

    const handleFormSave = () => {
        setEditingFormId(null);
        setRefreshKey(prev => prev + 1); // Trigger a re-fetch
    };

    const handleDelete = async (formId: string) => {
        if (!firestore) return;
        
        try {
            const productsSoldRef = collection(firestore, `selling_forms/${formId}/selling_form_products`);
            const productsSoldSnapshot = await getDocs(productsSoldRef);
            const productsSold = productsSoldSnapshot.docs.map(d => d.data() as SellingFormProduct);

            for (const item of productsSold) {
                const productRef = doc(firestore, 'products', item.productId);
                await runTransaction(firestore, async (transaction) => {
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        const currentQuantity = productDoc.data().currentQuantity || 0;
                        const newQuantity = Number(currentQuantity) + Number(item.quantity);
                        transaction.update(productRef, { currentQuantity: newQuantity });
                    }
                });
            }

            const paymentsRef = collection(firestore, `selling_forms/${formId}/payments`);
            const paymentsSnapshot = await getDocs(paymentsRef);
            await Promise.all(productsSoldSnapshot.docs.map(d => deleteDoc(d.ref)));
            await Promise.all(paymentsSnapshot.docs.map(p => deleteDoc(p.ref)));

            await deleteDoc(doc(firestore, 'selling_forms', formId));

            toast({
                title: "سەرکەوتوو بوو",
                description: "فۆڕمی فرۆشتن بە سەرکەوتوویی سڕایەوە و کاڵاکان گەڕێنرانەوە بۆ کۆگا.",
                className: "bg-accent text-accent-foreground",
            });
            handleFormSave();
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
        <>
            <PageHeader title="بەڕێوەبردنی فرۆشتن" description="تۆماری فۆڕمەکانی فرۆشتن لێرە ببینە و زیاد بکە.">
                 <SalesFormDialog
                    formId={null}
                    onSave={handleFormSave}
                    trigger={
                        <Button>
                            <PlusCircle />
                            دروستکردنی فۆڕمی فرۆشتن
                        </Button>
                    }
                />
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>لیستی فرۆشتنەکان</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">
                                    <Button variant="ghost" onClick={() => requestSort('formNumber')}>
                                        {getSortIcon('formNumber')} ژ. فۆڕم
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                     <Button variant="ghost" onClick={() => requestSort('customerName')}>
                                        {getSortIcon('customerName')} کڕیار
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                     <Button variant="ghost" onClick={() => requestSort('issueDate')}>
                                        {getSortIcon('issueDate')} بەروار
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                     <Button variant="ghost" onClick={() => requestSort('totalPrice')}>
                                        {getSortIcon('totalPrice')} بڕی فرۆشراو
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center">
                                     <Button variant="ghost" onClick={() => requestSort('paymentStatus')}>
                                        {getSortIcon('paymentStatus')} بارودۆخ
                                    </Button>
                                </TableHead>
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
                            ) : !sortedSales || sortedSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">هیچ فرۆشێک تۆمار نەکراوە.</TableCell>
                                </TableRow>
                            ) : (
                                sortedSales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium text-center">{sale.formNumber}</TableCell>
                                    <TableCell className="text-center">{sale.customerName}</TableCell>
                                    <TableCell className="text-center">{sale.issueDate}</TableCell>
                                    <TableCell className="text-center">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sale.totalPrice || 0)}</TableCell>
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
                                            <SalesFormDialog
                                                formId={sale.id}
                                                onSave={handleFormSave}
                                                trigger={
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                }
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم فۆڕمە؟</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            ئەم کردارە پاشگەزبوونەوەی نییە. کاڵاکان دەگەڕێنرێنەوە بۆ کۆگا و فۆڕمەکە بە هەمیشەیی دەسڕێتەوە.
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
        </>
    );
}

export default function SalesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <SalesList />
        </div>
    );
}
