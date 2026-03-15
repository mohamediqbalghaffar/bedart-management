'use client';

import React, { useState, useMemo, useEffect, useRef, use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, Loader2, FileSpreadsheet, Trash2, Edit, ArrowUpDown, Search, FileDown, FileUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc, getDocs, runTransaction, getDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentStatus, PaymentType } from '@/lib/types';
import { PrintableReceipt } from './components/printable-receipt';
import './printable-receipt.css';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import { analyzePurchaseExcel } from '@/ai/flows/analyze-purchase-excel';

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

function UploadSalesFormButton({ onSave }: { onSave: () => void }) {
    const [isParsing, setIsParsing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [initialItems, setInitialItems] = useState<any[] | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const firestore = useFirestore();

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'products');
    }, [firestore]);
    
    const { data: allProducts } = useCollection<any>(productsQuery);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        toast({ title: '...شیکردنەوەی فایل' });

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUri = e.target?.result;
                if (typeof dataUri !== 'string') {
                    toast({ variant: 'destructive', title: "هەڵە لە خوێندنەوەی فایل" });
                    setIsParsing(false);
                    return;
                }
                
                try {
                    const existingProductNames = allProducts?.map(p => p.productName) || [];
                    const result = await analyzePurchaseExcel({ purchaseDataAsCsv: dataUri, existingProductNames } as any);
                    
                    const newItems = result.map(item => ({
                        product: item.product,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice, 
                        category: item.category,
                    }));

                    if (newItems.length > 0) {
                        setInitialItems(newItems);
                        setDialogOpen(true);
                    } else {
                        toast({ variant: 'destructive', title: "هیچ کاڵایەک نەدۆزرایەوە", description: "AI نەیتوانی هیچ کاڵایەک لەم فایلە دەربهێنێت." });
                    }

                } catch (aiError: any) {
                     console.error("AI analysis failed:", aiError);
                     toast({ variant: 'destructive', title: "هەڵە لە شیکردنەوەی فایل", description: "AI نەیتوانی داتاکان دەربهێنێت." });
                } finally {
                    setIsParsing(false);
                     if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error("File processing error:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "پرۆسێسی فایلەکە سەرکەوتوو نەبوو." });
            setIsParsing(false);
        }
    };
    
    const triggerUpload = () => fileInputRef.current?.click();

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg, image/png, application/pdf"
            />
            <Button onClick={triggerUpload} disabled={isParsing} variant="outline">
                {isParsing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileUp />}
                هاوردەکردنی پسوولە
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-4xl" dir="rtl">
                    <DialogHeader>
                        <div className="text-center p-4">
                            <DialogTitle className="text-2xl font-bold">BedArt Group</DialogTitle>
                            <DialogDescription className="text-sm">
                               وردبینی زانیارییەکان بکە و پاشەکەوتی بکە.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[80vh] overflow-y-auto p-2">
                        <SalesForm 
                            formId={null} 
                            onSave={() => { onSave(); setDialogOpen(false); }} 
                            initialItems={initialItems} 
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ReceiptPreview({ formId }: { formId: string }) {
    const firestore = useFirestore();
    const [printData, setPrintData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPrintData = async () => {
            if (!firestore || !formId) return;
            setIsLoading(true);
    
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
                    setIsLoading(false);
                    return;
                }
    
                const rawData = formSnap.data();
                // Ensure customerPhoneNumber is prioritized, even if it was saved as customerPhone previously
                const standardizedData = {
                    ...rawData,
                    customerPhoneNumber: rawData.customerPhoneNumber || rawData.customerPhone || ""
                };

                setPrintData({
                    formData: standardizedData,
                    products: productsSnap.docs.map(d => d.data()),
                    payments: paymentsSnap.docs.map(d => d.data()),
                    companyInfo: companyInfoSnap.exists() ? companyInfoSnap.data() : null,
                });
    
            } catch (error) {
                console.error("Error preparing print data:", error);
                toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'ئامادەکردنی داتا بۆ بینین سەرکەوتوو نەبوو.' });
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchPrintData();
    }, [formId, firestore, toast]);

    const handleDownloadAsJPEG = async () => {
        if (!receiptRef.current) {
            toast({ variant: 'destructive', title: 'هەڵە', description: 'نەتوانرا وێنەی پسوولە دروستبکرێت.' });
            return;
        }
        setIsDownloading(true);
        toast({ title: '...ئامادەکردنی وێنە' });
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = `receipt-${printData.formData.formNumber}.jpeg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: 'سەرکەوتوو بوو', description: 'پسوولەکە وەک وێنە دابەزێنرا.', className: 'bg-accent text-accent-foreground' });
        } catch (error) {
            console.error('Error downloading as JPEG:', error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'دابەزاندنی وێنەکە سەرکەوتوو نەبوو.' });
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (!printData) {
        return <div className="text-center p-8 text-muted-foreground">داتا بۆ ئەم پسوولەیە نەدۆزرایەوە.</div>
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 bg-slate-900/50 p-2 sm:p-8 overflow-auto rounded-lg flex justify-center items-start">
                 <div className="shadow-2xl origin-top scale-[0.35] sm:scale-[0.5] md:scale-[0.75] lg:scale-[0.9] xl:scale-100 transition-transform">
                    <PrintableReceipt
                        ref={receiptRef}
                        formData={printData.formData}
                        products={printData.products}
                        payments={printData.payments}
                        companyInfo={printData.companyInfo}
                    />
                </div>
            </div>
            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                 <Button onClick={handleDownloadAsJPEG} disabled={isDownloading} className="w-full sm:w-auto h-12 text-base font-bold shadow-lg" size="lg">
                    {isDownloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
                    دابەزاندنی پسوولە (JPEG A4)
                </Button>
            </DialogFooter>
        </div>
    );
}

function SalesList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: keyof SellingFormType; direction: 'ascending' | 'descending' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<PaymentType | 'all'>('all');

    const [editingFormId, setEditingFormId] = useState<string | null>(null);
    const [previewFormId, setPreviewFormId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const [printData, setPrintData] = useState<any>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef(null);

    const sellingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'selling_forms');
    }, [firestore, refreshKey]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<SellingFormType>(sellingFormsQuery);

    const sortedSales = useMemo(() => {
        if (!sales) return [];
        let sortableItems = [...sales];

        sortableItems = sortableItems.filter(sale => {
            const searchMatch = searchTerm ? 
                sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                sale.formNumber.includes(searchTerm) : true;
            const statusMatch = statusFilter !== 'all' ? sale.paymentStatus === statusFilter : true;
            const typeMatch = typeFilter !== 'all' ? sale.paymentType === typeFilter : true;
            return searchMatch && statusMatch && typeMatch;
        });

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

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
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
        setIsCreateDialogOpen(false);
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
                description: "فۆڕمی فرۆشتن بە سەرکەوتوویی سڕایەوە.",
                className: "bg-accent text-accent-foreground",
            });
            handleFormSave();
        } catch (error) {
            console.error("Error deleting sales form:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەی فۆڕمی فرۆشتن سەرکەوتوو نەبوو." });
        }
    };

    const handleDirectPrint = async (formId: string) => {
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

            if (formSnap.exists()) {
                const rawData = formSnap.data();
                const standardizedData = {
                    ...rawData,
                    customerPhoneNumber: rawData.customerPhoneNumber || rawData.customerPhone || ""
                };

                setPrintData({
                    formData: standardizedData,
                    products: productsSnap.docs.map(d => d.data()),
                    payments: paymentsSnap.docs.map(d => d.data()),
                    companyInfo: companyInfoSnap.exists() ? companyInfoSnap.data() : null,
                });
                
                setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    setPrintData(null);
                }, 500);
            }
        } catch (error) {
            console.error("Print failed:", error);
            setIsPrinting(false);
        }
    };

    return (
        <>
            <PageHeader title="بەڕێوەبردنی فرۆشتن" description="تۆماری فۆڕمەکانی فرۆشتن لێرە ببینە و زیاد بکە.">
                 <div className="flex items-center gap-2">
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle />
                        دروستکردنی فۆڕمی فرۆشتن
                    </Button>
                    <UploadSalesFormButton onSave={handleFormSave} />
                </div>
            </PageHeader>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-4xl" dir="rtl">
                    <DialogHeader>
                        <div className="text-center p-4">
                           <DialogTitle className="text-2xl font-bold">BedArt Group</DialogTitle>
                            <DialogDescription className="text-sm">تەختی نوستن . دۆشەک . پشتی</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[80vh] overflow-y-auto p-2">
                        <SalesForm formId={null} onSave={handleFormSave} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingFormId} onOpenChange={(open) => !open && setEditingFormId(null)}>
                <DialogContent className="sm:max-w-4xl" dir="rtl">
                    <DialogHeader>
                        <div className="text-center p-4">
                           <DialogTitle className="text-2xl font-bold">BedArt Group</DialogTitle>
                            <DialogDescription className="text-sm">دەستکاریکردنی فۆڕم</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[80vh] overflow-y-auto p-2">
                        {editingFormId && <SalesForm formId={editingFormId} onSave={handleFormSave} />}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewFormId} onOpenChange={(open) => !open && setPreviewFormId(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-5xl h-[90vh] flex flex-col p-4" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>پێشبینینی پسوولە</DialogTitle>
                    </DialogHeader>
                    {previewFormId && <ReceiptPreview formId={previewFormId} />}
                </DialogContent>
            </Dialog>

            {isPrinting && printData && (
                <div id="printable-area" className="fixed inset-0 z-[9999] bg-white">
                    <PrintableReceipt
                        ref={printRef}
                        formData={printData.formData}
                        products={printData.products}
                        payments={printData.payments}
                        companyInfo={printData.companyInfo}
                    />
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>لیستی فرۆشتنەکان</CardTitle>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="گەڕان بەپێی ناوی کڕیار یان ژمارەی فۆڕم..."
                                className="pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                             <Select dir="rtl" value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                                <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {paymentStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select dir="rtl" value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                                <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {paymentTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table className="hidden md:table">
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
                                            <Button variant="ghost" size="icon" onClick={() => setEditingFormId(sale.id)}>
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
                                                        <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم فۆڕمە؟</AlertDialogTitle>
                                                        <AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(sale.id)} className="bg-destructive hover:bg-destructive/90">بەڵێ، بسڕەوە</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <FileSpreadsheet className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent dir="rtl">
                                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setPreviewFormId(sale.id); }}>
                                                        بینینی پسوولە
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDirectPrint(sale.id); }}>
                                                        چاپکردنی پسوولە
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )))}
                        </TableBody>
                    </Table>
                    <div className="md:hidden space-y-4">
                        {isLoadingSales ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                        ) : !sortedSales || sortedSales.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">هیچ فرۆشێک بەم پێوەرانە نەدۆزرایەوە.</div>
                        ) : (
                             sortedSales.map((sale) => (
                                <Card key={sale.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>{sale.customerName}</CardTitle>
                                                <CardDescription>فۆڕمی #{sale.formNumber} - {sale.issueDate}</CardDescription>
                                            </div>
                                             <Badge 
                                                variant={sale.paymentStatus === 'Fully Paid' ? 'default' : sale.paymentStatus === 'Unpaid' ? 'destructive' : 'secondary'} 
                                                className={sale.paymentStatus === 'Fully Paid' ? 'bg-green-600 text-white' : ''}
                                            >
                                                {paymentStatusOptions.find(o => o.value === sale.paymentStatus)?.label || sale.paymentStatus}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">کۆی گشتی:</span>
                                            <span className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sale.totalPrice || 0)}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 mr-2 text-destructive" />سڕینەوە</Button></AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader><AlertDialogTitle>دڵنیایت؟</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>نەخێر</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(sale.id)} className="bg-destructive">بەڵێ</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                         <Button variant="ghost" size="sm" onClick={() => setEditingFormId(sale.id)}>
                                            <Edit className="h-4 w-4 mr-2 text-blue-500" />دەستکاری
                                         </Button>
                                         <Button variant="ghost" size="sm" onClick={() => setPreviewFormId(sale.id)}>
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />وردەکاری
                                         </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default function SalesPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <SalesList />
        </div>
    );
}
