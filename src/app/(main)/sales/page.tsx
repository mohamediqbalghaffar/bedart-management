
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileSpreadsheet, Trash2, Edit, ArrowUpDown, Search, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc, getDocs, runTransaction, getDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { SalesDetails } from './components/sales-details';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentStatus, PaymentType } from '@/lib/types';
import { PrintableReceipt } from './components/printable-receipt';
import './printable-receipt.css';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


// Matches the structure in backend.json for SellingForm
type SellingFormType = {
    customerName: string;
    issueDate: string;
    totalPrice: number;
    paymentStatus: PaymentStatus;
    paymentType: PaymentType;
    formNumber: string;
    creatorName?: string;
    customerPhoneNumber?: string;
    deliveryCost?: number;
    discountType?: 'percentage' | 'cash';
    discountValue?: number;
};

type SellingFormProduct = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

type CompanyInfo = {
    name: string;
    contact: string;
}

const paymentStatusOptions: { value: PaymentStatus | 'all', label: string }[] = [
    { value: 'all', label: 'هەموو دۆخەکان'},
    { value: 'Fully Paid', label: 'هەمووی دراوە'},
    { value: 'Partially Paid', label: 'بەشێکی دراوە'},
    { value: 'Unpaid', label: 'نەدراوە'},
];

const paymentTypeOptions: { value: PaymentType | 'all', label: string }[] = [
    { value: 'all', label: 'هەموو جۆرەکان'},
    { value: 'Direct Payment', label: 'پارەی ڕاستەوخۆ'},
    { value: 'After Delivery', label: 'دوای گەیاندن'},
    { value: 'Installments', label: 'قیست'},
    { value: 'Pre-order', label: 'داواکاری پێشوەختە'},
];

function SalesFormDialog({ formId, onSave, trigger }: { formId: string | null, onSave: () => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-4xl" dir="rtl">
                <DialogHeader>
                    <div className="text-center p-4">
                       <DialogTitle className="text-2xl font-bold">BedArt Group</DialogTitle>
                        <DialogDescription className="text-sm">
                            تەختی نوستن . دۆشەک . پشتی
                            <br />
                            <span className="text-xs text-muted-foreground">07708171818 - 07700771818</span>
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto p-2">
                    <SalesForm formId={formId} onSave={() => { onSave(); setOpen(false); }} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DirectPrintButton({ formId, id }: { formId: string, id?: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPrinting, setIsPrinting] = useState(false);
    const [printData, setPrintData] = useState<any>(null);
    const printRef = useRef(null);

    useEffect(() => {
        if (isPrinting && printData) {
            const timer = setTimeout(() => {
                window.print();
                setIsPrinting(false);
                setPrintData(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isPrinting, printData]);

    const handlePrint = async () => {
        if (!firestore) return;
        setIsPrinting(true);
        toast({ title: '...ئامادەکردنی پسوولە' });

        try {
            const formRef = doc(firestore, 'selling_forms', formId);
            const productsRef = collection(firestore, `selling_forms/${formId}/selling_form_products`);
            const paymentsRef = collection(firestore, `selling_forms/${formId}/payments`);
            const companyInfoRef = doc(firestore, 'app_settings', 'companyInfo');

            const [formSnap, productsSnap, paymentsSnap, companyInfoSnap] = await Promise.all([
                getDoc(formRef),
                getDocs(productsRef),
                getDocs(paymentsRef),
                getDoc(companyInfoRef),
            ]);

            if (!formSnap.exists()) {
                toast({ variant: 'destructive', title: 'هەڵە', description: 'پسوولە نەدۆزرایەوە.' });
                setIsPrinting(false);
                return;
            }

            setPrintData({
                formData: formSnap.data(),
                products: productsSnap.docs.map(d => d.data()),
                payments: paymentsSnap.docs.map(d => d.data()),
                companyInfo: companyInfoSnap.exists() ? companyInfoSnap.data() : null,
            });

        } catch (error) {
            console.error("Error preparing print data:", error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'ئامادەکردنی داتا بۆ چاپ سەرکەوتوو نەبوو.' });
            setIsPrinting(false);
        }
    };

    return (
        <>
            <Button id={id} variant="ghost" size="icon" onClick={handlePrint} disabled={isPrinting}>
                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-green-500" />}
            </Button>
            {isPrinting && printData && (
                 <div id="printable-area">
                    <PrintableReceipt
                        ref={printRef}
                        formData={printData.formData}
                        products={printData.products}
                        payments={printData.payments}
                        companyInfo={printData.companyInfo}
                    />
                </div>
            )}
        </>
    );
}


function SalesList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingFormId, setEditingFormId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: keyof SellingFormType; direction: 'ascending' | 'descending' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<PaymentType | 'all'>('all');

    const sellingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'selling_forms');
    }, [firestore, refreshKey]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<SellingFormType>(sellingFormsQuery);

    const sortedSales = useMemo(() => {
        if (!sales) return [];
        let sortableItems = [...sales];

        // Filtering
        sortableItems = sortableItems.filter(sale => {
            const searchMatch = searchTerm ? 
                sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                sale.formNumber.includes(searchTerm) : true;
            const statusMatch = statusFilter !== 'all' ? sale.paymentStatus === statusFilter : true;
            const typeMatch = typeFilter !== 'all' ? sale.paymentType === typeFilter : true;
            return searchMatch && statusMatch && typeMatch;
        });

        // Sorting
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (sortConfig.key === 'formNumber') {
                    const numA = parseInt(String(aValue), 10);
                    const numB = parseInt(String(bValue), 10);
                    if (isNaN(numA) || isNaN(numB)) {
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
    }, [sales, sortConfig, searchTerm, statusFilter, typeFilter]);

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
        setRefreshKey(prev => prev + 1);
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
                    <div className="flex items-center justify-between gap-4 mt-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="گەڕان بەپێی ناوی کڕیار یان ژمارەی فۆڕم..."
                                className="pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                             <Select dir="rtl" value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {paymentStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select dir="rtl" value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {paymentTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">هیچ فرۆشێک بەم پێوەرانە نەدۆزرایەوە.</TableCell>
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
                                            className={sale.paymentStatus === 'Fully Paid' ? 'bg-green-600 text-white' : ''}
                                        >
                                            {paymentStatusOptions.find(o => o.value === sale.paymentStatus)?.label || sale.paymentStatus}
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
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <FileSpreadsheet className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DialogTrigger asChild>
                                                            <DropdownMenuItem>
                                                                بینینی فایل
                                                            </DropdownMenuItem>
                                                        </DialogTrigger>
                                                        <DropdownMenuItem onSelect={(e) => {
                                                            e.preventDefault();
                                                            document.getElementById(`print-btn-${sale.id}`)?.click()
                                                        }}>
                                                            چاپکردنی فایل
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <DialogContent className="sm:max-w-2xl" dir="rtl">
                                                    <DialogHeader>
                                                        <DialogTitle>وردەکارییەکانی فۆڕمی فرۆشتن</DialogTitle>
                                                    </DialogHeader>
                                                    <SalesDetails formId={sale.id} />
                                                </DialogContent>
                                            </Dialog>
                                            <div className="hidden">
                                                <DirectPrintButton formId={sale.id} id={`print-btn-${sale.id}`} />
                                            </div>
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
