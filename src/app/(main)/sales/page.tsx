
'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileSpreadsheet, Trash2, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc, getDocs, runTransaction } from '@/firebase';
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
    quantity: number;
};


function SalesList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFormId, setEditingFormId] = useState<string | null>(null);

    const sellingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'selling_forms');
    }, [firestore]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<SellingFormType>(sellingFormsQuery);

    const handleEdit = (formId: string) => {
        setEditingFormId(formId);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingFormId(null);
        setDialogOpen(true);
    };

    const handleDelete = async (formId: string) => {
        if (!firestore) return;
        
        try {
            // 1. Fetch all items from the form's products subcollection
            const productsSoldRef = collection(firestore, `selling_forms/${formId}/products`);
            const productsSoldSnapshot = await getDocs(productsSoldRef);
            const productsSold = productsSoldSnapshot.docs.map(d => d.data() as SellingFormProduct);

            // 2. Run transactions to add stock back
            for (const item of productsSold) {
                const productRef = doc(firestore, 'products', item.productId);
                await runTransaction(firestore, async (transaction) => {
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        const newQuantity = (productDoc.data().currentQuantity || 0) + item.quantity;
                        transaction.update(productRef, { currentQuantity: newQuantity });
                    }
                });
            }

            // 3. Delete documents in subcollections (products, payments)
            const paymentsRef = collection(firestore, `selling_forms/${formId}/payments`);
            const productsSnapshot = await getDocs(productsSoldRef);
            const paymentsSnapshot = await getDocs(paymentsRef);
            await Promise.all(productsSnapshot.docs.map(d => deleteDoc(d.ref)));
            await Promise.all(paymentsSnapshot.docs.map(p => deleteDoc(p.ref)));


            // 4. Delete the main form document
            await deleteDoc(doc(firestore, 'selling_forms', formId));

            toast({
                title: "سەرکەوتوو بوو",
                description: "فۆڕمی فرۆشتن بە سەرکەوتوویی سڕایەوە و کاڵاکان گەڕێنرانەوە بۆ کۆگا.",
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
        <>
            <PageHeader title="فرۆشەکان" description="بەڕێوەبردن و بەدواداچوونی هەموو کارەکانی فرۆشتنت.">
                <Button onClick={handleAddNew}>
                    <PlusCircle />
                    دروستکردنی فۆڕمی فرۆشتن
                </Button>
            </PageHeader>
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
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(sale.id)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                        <SalesForm formId={editingFormId} onSave={() => setDialogOpen(false)} />
                    </div>
                </DialogContent>
            </Dialog>
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
