'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, doc, collection } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { WithId } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfidentialBlur } from '@/components/shared/confidential-blur';

type BuyingFormType = {
    id: string;
    supplierId: string;
    issueDate: string;
    customsFee?: number;
    stockLocation: string;
};

type ProductBuyingForm = {
    productName: string;
    quantity: number;
    unitPrice: number;
};

type Supplier = {
    supplierName: string;
};

export function PurchaseDetails({ formId }: { formId: string }) {
    const firestore = useFirestore();

    const formRef = useMemoFirebase(() => firestore ? doc(firestore, 'buying_forms', formId) : null, [firestore, formId]);
    const productsRef = useMemoFirebase(() => firestore ? collection(firestore, `buying_forms/${formId}/buying_form_products`) : null, [firestore, formId]);

    const { data: formData, isLoading: isLoadingForm } = useDoc<BuyingFormType>(formRef);
    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductBuyingForm>(productsRef);

    const supplierRef = useMemoFirebase(() => (firestore && formData) ? doc(firestore, 'suppliers', formData.supplierId) : null, [firestore, formData]);
    const { data: supplier, isLoading: isLoadingSupplier } = useDoc<Supplier>(supplierRef);
    
    const isLoading = isLoadingForm || isLoadingProducts || isLoadingSupplier;
    
    const subTotal = React.useMemo(() => {
        return products?.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) || 0;
    }, [products]);

    const totalAmount = subTotal + (formData?.customsFee || 0);
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!formData) {
        return <div className="text-center text-muted-foreground p-8">پسوولەکە نەدۆزرایەوە.</div>;
    }

    return (
        <div className="space-y-6" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle>زانیاری سەرەکی</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">دابینکەر:</span>
                            <p className="text-muted-foreground">{supplier?.supplierName || 'نەزانراو'}</p>
                        </div>
                        <div>
                            <span className="font-semibold">بەرواری پسوولە:</span>
                            <p className="text-muted-foreground">{formData.issueDate}</p>
                        </div>
                         <div>
                            <span className="font-semibold">شوێنی دانان:</span>
                            <p className="text-muted-foreground">{formData.stockLocation === 'Warehouse' ? 'کۆگا' : 'فرۆشگا'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>لیستی کاڵا کڕاوەکان</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] -mx-6">
                        {/* Desktop Table */}
                        <Table className="hidden md:table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">نرخی کۆ (USD)</TableHead>
                                    <TableHead className="text-right">نرخی تاک (USD)</TableHead>
                                    <TableHead className="text-right">دانە</TableHead>
                                    <TableHead className="text-right">کاڵا</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products && products.length > 0 ? (
                                    products.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-left font-semibold"><ConfidentialBlur>{currencyFormatter.format(item.quantity * item.unitPrice)}</ConfidentialBlur></TableCell>
                                            <TableCell className="text-right"><ConfidentialBlur>{currencyFormatter.format(item.unitPrice)}</ConfidentialBlur></TableCell>
                                            <TableCell className="text-right"><ConfidentialBlur>{item.quantity}</ConfidentialBlur></TableCell>
                                            <TableCell className="text-right">{item.productName}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">هیچ کاڵایەک بۆ ئەم پسوولەیە تۆمار نەکراوە.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 px-6">
                             {products && products.length > 0 ? (
                                products.map((item, index) => (
                                    <Card key={index}>
                                        <CardHeader>
                                            <CardTitle>{item.productName}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between"><span>دانە:</span><ConfidentialBlur><Badge variant="secondary">{item.quantity}</Badge></ConfidentialBlur></div>
                                            <div className="flex justify-between"><span>نرخی تاک:</span><ConfidentialBlur><Badge>{currencyFormatter.format(item.unitPrice)}</Badge></ConfidentialBlur></div>
                                            <div className="flex justify-between font-semibold"><span>نرخی کۆ:</span><ConfidentialBlur>{currencyFormatter.format(item.quantity * item.unitPrice)}</ConfidentialBlur></div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">هیچ کاڵایەک بۆ ئەم پسوولەیە تۆمار نەکراوە.</div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 space-y-2 text-left p-4 border-t">
                         <div className="flex justify-between"><span>کۆی کاڵاکان:</span><ConfidentialBlur><span className="font-medium">{currencyFormatter.format(subTotal)}</span></ConfidentialBlur></div>
                        <div className="flex justify-between"><span>تێچووی گومرگ:</span><ConfidentialBlur><span className="font-medium">{currencyFormatter.format(formData.customsFee || 0)}</span></ConfidentialBlur></div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>کۆی گشتی:</span><ConfidentialBlur><span>{currencyFormatter.format(totalAmount)}</span></ConfidentialBlur></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
