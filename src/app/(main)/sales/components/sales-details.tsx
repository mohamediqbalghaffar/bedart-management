'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, doc, collection, getDoc } from '@/firebase';
import { Loader2, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PaymentStatus, PaymentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PrintableReceipt } from './printable-receipt';
import '../printable-receipt.css';

type SellingFormType = {
    id: string;
    customerName: string;
    customerPhoneNumber?: string;
    customerAddress?: string;
    issueDate: string;
    totalPrice: number;
    remainingBalance: number;
    paymentStatus: PaymentStatus;
    paymentType: PaymentType;
    formNumber: string;
    deliveryCost?: number;
    discountType?: 'percentage' | 'cash';
    discountValue?: number;
    creatorName?: string;
};

type ProductSellingForm = {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

type Payment = {
    id: string;
    paymentDate: string;
    amountPaid: number;
    paymentMethod: 'Cash' | 'Transfer';
    note?: string;
};

const paymentStatusTranslations: Record<PaymentStatus, string> = {
    'Fully Paid': 'هەمووی دراوە',
    'Partially Paid': 'بەشێکی دراوە',
    'Unpaid': 'نەدراوە'
};

const paymentTypeTranslations: Record<PaymentType, string> = {
    'Direct Payment': 'پارەی ڕاستەوخۆ',
    'After Delivery': 'دوای گەیاندن',
    'Installments': 'قیست',
    'Pre-order': 'داواکاری پێشوەختە',
};

function PrintButton({ formData, products, payments }: { formData: any, products: any[], payments: any[] }) {
    const firestore = useFirestore();
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [showPrintable, setShowPrintable] = useState(false);

    useEffect(() => {
        if (showPrintable) {
            setTimeout(() => {
                window.print();
                setShowPrintable(false);
            }, 100); // Small delay to ensure render
        }
    }, [showPrintable]);

    const handlePrint = async () => {
        if (!firestore) return;
        try {
            const infoRef = doc(firestore, 'app_settings', 'companyInfo');
            const docSnap = await getDoc(infoRef);
            if (docSnap.exists()) {
                setCompanyInfo(docSnap.data());
            }
        } finally {
            setShowPrintable(true);
        }
    };
    
    return (
        <>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />چاپکردن</Button>
            {showPrintable && (
                <div id="printable-area">
                    <PrintableReceipt formData={formData} products={products} payments={payments} companyInfo={companyInfo} />
                </div>
            )}
        </>
    );
}

export function SalesDetails({ formId }: { formId: string }) {
    const firestore = useFirestore();

    const formRef = useMemoFirebase(() => firestore ? doc(firestore, 'selling_forms', formId) : null, [firestore, formId]);
    const productsRef = useMemoFirebase(() => firestore ? collection(firestore, `selling_forms/${formId}/selling_form_products`) : null, [firestore, formId]);
    const paymentsRef = useMemoFirebase(() => firestore ? collection(firestore, `selling_forms/${formId}/payments`) : null, [firestore, formId]);

    const { data: formData, isLoading: isLoadingForm } = useDoc<SellingFormType>(formRef);
    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductSellingForm>(productsRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsRef);

    const isLoading = isLoadingForm || isLoadingProducts || isLoadingPayments;

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!formData || !products || !payments) {
        return <div className="text-center text-muted-foreground p-8">فۆڕمەکە نەدۆزرایەوە یان داتای تەواو نییە.</div>;
    }
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const subTotal = products?.reduce((acc, item) => acc + item.lineTotal, 0) || 0;
    const discountAmount = (() => {
        if (!formData.discountType || !formData.discountValue) return 0;
        if (formData.discountType === 'percentage') {
            return (subTotal * formData.discountValue) / 100;
        }
        return formData.discountValue;
    })();

    const totalPaid = payments?.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0) || 0;
    const calculatedRemaining = Math.max(0, formData.totalPrice - totalPaid);
    const overpayment = Math.max(0, totalPaid - formData.totalPrice);

    return (
        <div className="space-y-6">
             <div id="non-printable-area">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>فۆڕمی فرۆشتن #{formData.formNumber}</CardTitle>
                                <CardDescription>بەروار: {formData.issueDate}</CardDescription>
                            </div>
                            <div className="flex gap-2 items-center">
                                <PrintButton formData={formData} products={products} payments={payments} />
                                <Badge 
                                    variant={formData.paymentStatus === 'Fully Paid' ? 'default' : formData.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'} 
                                    className={formData.paymentStatus === 'Fully Paid' ? 'bg-accent text-accent-foreground' : ''}
                                >
                                    {paymentStatusTranslations[formData.paymentStatus] || formData.paymentStatus}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-semibold">کڕیار:</span><p className="text-muted-foreground">{formData.customerName}</p></div>
                            <div><span className="font-semibold">ژ. مۆبایل:</span><p className="text-muted-foreground">{formData.customerPhoneNumber || 'نەزانراو'}</p></div>
                            <div className="col-span-2"><span className="font-semibold">ناونیشان:</span><p className="text-muted-foreground">{formData.customerAddress || 'نەزانراو'}</p></div>
                             <div className="col-span-2"><span className="font-semibold">فرۆشیار:</span><p className="text-muted-foreground">{formData.creatorName || 'نەزانراو'}</p></div>
                            <div className="col-span-2"><span className="font-semibold">جۆری پارەدان:</span><p className="text-muted-foreground">{paymentTypeTranslations[formData.paymentType] || formData.paymentType}</p></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>کاڵا فرۆشراوەکان</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead className="text-right">کاڵا</TableHead><TableHead className="text-right">دانە</TableHead><TableHead className="text-right">نرخی تاک</TableHead><TableHead className="text-left">نرخی کۆ</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {products && products.length > 0 ? (
                                    products.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-right">{item.productName}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{currencyFormatter.format(item.unitPrice)}</TableCell>
                                            <TableCell className="text-left font-semibold">{currencyFormatter.format(item.lineTotal)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center">هیچ کاڵایەک بۆ ئەم فۆڕمە تۆمار نەکراوە.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="mt-4 space-y-2 text-left p-4 border-t">
                            <div className="flex justify-between"><span>کۆی کاڵاکان:</span><span className="font-medium">{currencyFormatter.format(subTotal)}</span></div>
                            {discountAmount > 0 && <div className="flex justify-between text-destructive"><span>داشکاندن:</span><span className="font-medium">-{currencyFormatter.format(discountAmount)}</span></div>}
                            <div className="flex justify-between"><span>تێچووی گەیاندن:</span><span className="font-medium">{currencyFormatter.format(formData.deliveryCost || 0)}</span></div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>کۆی گشتی:</span><span>{currencyFormatter.format(formData.totalPrice)}</span></div>
                        </div>
                    </CardContent>
                </Card>

                {(formData.paymentType === 'Installments' || (payments && payments.length > 0)) && (
                    <Card>
                        <CardHeader><CardTitle>تۆماری پارەدانەکان</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead className="text-right">بەروار</TableHead><TableHead className="text-right">بڕ</TableHead><TableHead className="text-right">شێواز</TableHead><TableHead className="text-right">تێبینی</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {payments && payments.length > 0 ? (
                                        payments.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-right">{p.paymentDate}</TableCell>
                                                <TableCell className="text-right font-semibold">{currencyFormatter.format(p.amountPaid)}</TableCell>
                                                <TableCell className="text-right">{p.paymentMethod === 'Cash' ? 'کاش' : 'حەواڵە'}</TableCell>
                                                <TableCell className="text-right">{p.note || 'نەزانراو'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center">هیچ پارەدانێک تۆمار نەکراوە.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="mt-4 space-y-2 text-left p-4 border-t">
                                <div className="flex justify-between"><span>کۆی دراوە:</span><span className="font-medium text-green-500">{currencyFormatter.format(totalPaid)}</span></div>
                                <div className="flex justify-between font-bold text-lg text-destructive"><span>ماوە:</span><span>{currencyFormatter.format(calculatedRemaining)}</span></div>
                                {overpayment > 0 && (
                                    <div className="flex justify-between font-bold text-lg text-green-500">
                                        <span>بڕی زیادە:</span>
                                        <span>{currencyFormatter.format(overpayment)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
