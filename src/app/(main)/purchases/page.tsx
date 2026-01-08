
'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, Trash2, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { BuyingForm } from "./components/buying-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc, getDocs, runTransaction } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getDocs as getDocsClient, collection as getCollectionClient } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { PurchaseDetails } from './components/purchase-details';


// Matches the structure in backend.json
type BuyingFormType = {
    supplierId: string;
    issueDate: string;
    customsFee?: number;
};

type Supplier = {
    supplierName: string;
};

type BuyingFormProduct = {
    productId: string;
    quantity: number;
    unitPrice: number;
};

type EnrichedBuyingForm = WithId<BuyingFormType> & {
    supplierName?: string;
    totalAmount?: number;
};

function PurchasesList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

    const buyingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'buying_forms');
    }, [firestore]);

    const suppliersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'suppliers');
    }, [firestore]);

    const { data: buyingForms, isLoading: isLoadingForms } = useCollection<BuyingFormType>(buyingFormsQuery);
    const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersQuery);

    const [enrichedForms, setEnrichedForms] = useState<EnrichedBuyingForm[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        async function enrichAndCalculateTotals() {
            if (!buyingForms || !suppliers || !firestore) return;

            setIsCalculating(true);
            const supplierMap = new Map(suppliers.map(s => [s.id, s.supplierName]));

            const enriched = await Promise.all(buyingForms.map(async (form) => {
                const productsColRef = getCollectionClient(firestore, `buying_forms/${form.id}/products`);
                const productsSnapshot = await getDocsClient(productsColRef);
                const products = productsSnapshot.docs.map(doc => doc.data() as BuyingFormProduct);

                const subTotal = products.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                const totalAmount = subTotal + (form.customsFee || 0);

                return {
                    ...form,
                    supplierName: supplierMap.get(form.supplierId) || 'Unknown Supplier',
                    totalAmount: totalAmount,
                };
            }));

            setEnrichedForms(enriched);
            setIsCalculating(false);
        }

        enrichAndCalculateTotals();

    }, [buyingForms, suppliers, firestore]);

    const handleDelete = async (formId: string) => {
        if (!firestore) return;
        
        try {
            // 1. Fetch all items from the form's products subcollection
            const productsPurchasedRef = collection(firestore, `buying_forms/${formId}/products`);
            const productsPurchasedSnapshot = await getDocs(productsPurchasedRef);
            const productsPurchased = productsPurchasedSnapshot.docs.map(d => d.data() as BuyingFormProduct);
            
            // 2. Run transactions to subtract stock
            for (const item of productsPurchased) {
                const productRef = doc(firestore, 'products', item.productId);
                await runTransaction(firestore, async (transaction) => {
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        const newQuantity = (productDoc.data().currentQuantity || 0) - item.quantity;
                        transaction.update(productRef, { currentQuantity: newQuantity < 0 ? 0 : newQuantity });
                    }
                });
            }

            // 3. Delete documents in subcollection
            await Promise.all(productsPurchasedSnapshot.docs.map(d => deleteDoc(d.ref)));

            // 4. Delete the main form document
            await deleteDoc(doc(firestore, 'buying_forms', formId));

            toast({
                title: "سەرکەوتوو بوو",
                description: "پسوولەی کڕین بە سەرکەوتوویی سڕایەوە و بڕی کاڵاکان لە کۆگا کەمکرایەوە.",
                className: "bg-accent text-accent-foreground",
            });
        } catch (error) {
            console.error("Error deleting document: ", error);
            toast({
                variant: 'destructive',
                title: "هەڵەیەک ڕوویدا",
                description: "سڕینەوەی پسوولەی کڕین سەرکەوتوو نەبوو.",
            });
        }
    };


    const isLoading = isLoadingForms || isLoadingSuppliers || isCalculating;

    return (
         <Card>
            <CardHeader>
                <CardTitle>کڕینەکانی ئەم دواییە</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">دابینکەر</TableHead>
                            <TableHead className="text-right">بەروار</TableHead>
                            <TableHead className="text-right">کۆی گشتی</TableHead>
                            <TableHead className="text-left">کردارەکان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : enrichedForms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">هیچ کڕینێک تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            enrichedForms.map((form) => (
                            <TableRow key={form.id}>
                                <TableCell className="font-medium text-right">{form.supplierName}</TableCell>
                                <TableCell className="text-right">{form.issueDate}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary">
                                      {new Intl.NumberFormat('en-US').format(form.totalAmount || 0)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-left">
                                    <div className="flex items-center justify-start gap-2">
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
                                                    ئەم کردارە پاشگەزبوونەوەی نییە. کاڵاکان لە کۆگا کەم دەکرێنەوە و پسوولەکە بە هەمیشەیی دەسڕێتەوە.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(form.id)} className="bg-destructive hover:bg-destructive/90">
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
                                                    <DialogTitle>وردەکارییەکانی پسوولەی کڕین</DialogTitle>
                                                </DialogHeader>
                                                <PurchaseDetails formId={form.id} />
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


export default function PurchasesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="کڕینەکان" description="پسوولەکانی کڕین و دابینکەرەکانت بەڕێوەببە.">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            پسوولەی کڕینی نوێ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>تۆمارکردنی پسوولەی کڕین</DialogTitle>
                             <DialogDescription>
                                زانیارییەکانی پسوولەی کڕینی نوێ بنووسە.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto p-2">
                            <BuyingForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <PurchasesList />
        </div>
    );
}
