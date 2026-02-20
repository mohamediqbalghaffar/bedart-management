
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, Trash2, FileSpreadsheet, Edit, FileUp, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { BuyingForm } from "./components/buying-form";
import { useFirestore, useCollection, useMemoFirebase, collection, runTransaction, doc, getDocs, deleteDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
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
import * as XLSX from 'xlsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { analyzePurchaseExcel } from '@/ai/flows/analyze-purchase-excel';

// Matches the structure in backend.json
type BuyingFormType = {
    supplierId: string;
    issueDate: string;
    customsFee?: number;
    totalAmount?: number;
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
    totalAmount: number;
};

type ProductDefinition = {
    productName: string;
    sellingPrice?: number;
    category: 'Mattress' | 'Bed' | 'Pillow' | 'Cover';
};

function PurchaseFormDialog({ formId, onSave, trigger, initialItems }: { formId: string | null, onSave: () => void, trigger: React.ReactNode, initialItems?: any[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-7xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{formId ? 'دەستکاریکردنی پسوولەی کڕین' : 'دروستکردنی پسوولەی کڕین'}</DialogTitle>
                    <DialogDescription>
                        {formId ? 'زانیارییەکانی پسوولەکە نوێ بکەرەوە.' : 'زانیارییەکانی پسوولەیەکی نوێی کڕین بنووسە.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto p-2">
                    <BuyingForm formId={formId} onSave={() => { onSave(); setOpen(false); }} initialItems={initialItems} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ImportActions({ onSave }: { onSave: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [initialItems, setInitialItems] = useState<any[] | undefined>(undefined);
    const [importType, setImportType] = useState<'ai' | 'standard' | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const firestore = useFirestore();

    const productDefinitionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'product_definitions');
    }, [firestore]);
    const { data: allProductDefinitions } = useCollection<ProductDefinition>(productDefinitionsQuery);

    const triggerUpload = (type: 'ai' | 'standard') => {
        setImportType(type);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        toast({ title: `...شیکردنەوەی فایل (${importType === 'ai' ? 'AI' : 'ستاندارد'})` });

        try {
            if (importType === 'ai') {
                await handleAiImport(file);
            } else {
                await handleStandardImport(file);
            }
        } catch (error: any) {
             console.error("Import failed:", error);
             toast({ variant: 'destructive', title: "هاوردەکردن سەرکەوتوو نەبوو", description: error.message });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const handleAiImport = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUri = e.target?.result;
            if (typeof dataUri !== 'string') {
                toast({ variant: 'destructive', title: "هەڵە لە خوێندنەوەی فایل" });
                return;
            }
            try {
                const existingProductNames = allProductDefinitions?.map(p => p.productName) || [];
                const result = await analyzePurchaseExcel({ documentDataUri: dataUri, existingProductNames });
                
                if (result && result.length > 0) {
                    setInitialItems(result);
                    setDialogOpen(true);
                } else {
                    toast({ variant: 'destructive', title: "هیچ کاڵایەک نەدۆزرایەوە", description: "AI نەیتوانی هیچ کاڵایەک لەم فایلە دەربهێنێت." });
                }
            } catch (aiError: any) {
                console.error("AI analysis failed:", aiError);
                 if (aiError.message && aiError.message.includes('429')) {
                    toast({ variant: 'destructive', title: "خزمەتگوزاری سەرقاڵە", description: "بەکارهێنانی API زیاد لە سنووری خۆی تێپەڕاندووە. تکایە پلانی بەکارهێنانت بپشکنە." });
                 } else {
                    toast({ variant: 'destructive', title: "هەڵە لە شیکردنەوەی AI", description: "AI نەیتوانی داتاکان دەربهێنێت." });
                 }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleStandardImport = async (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;
            
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const headers: string[] = [];
            const range = XLSX.utils.decode_range(worksheet['!ref']!);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: range.s.r })];
                const headerText = cell ? String(cell.v).trim() : `UNKNOWN_${C}`;
                headers[C] = headerText;
            }

            const nameIdx = headers.findIndex(h => h.includes('ناو'));
            const purchasePriceIdx = headers.findIndex(h => h.includes('نرخی کر'));
            const qtyIdx = headers.findIndex(h => h.includes('دانە') || h.includes('دانه'));
            const sellingPriceIdx = headers.findIndex(h => h.includes('نرخی فرۆشتن'));

            if (nameIdx === -1) {
                toast({ variant: 'destructive', title: "ستوونی پێویست نەدۆزرایەوە", description: "پێویستە فایلەکە ستوونی 'ناو'ی تێدابێت." });
                return;
            }

            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }).slice(1) as any[][];
            const productDefMap = new Map(allProductDefinitions?.map(p => [p.productName.toLowerCase().trim(), p]));

            const newItems = jsonData.map(row => {
                const productNameFromSheet = String(row[nameIdx] || '').trim();
                if (!productNameFromSheet) return null;

                const normalizedName = productNameFromSheet.toLowerCase();
                const existingDef = productDefMap.get(normalizedName);

                return {
                    product: existingDef ? existingDef.productName : productNameFromSheet,
                    quantity: Number(row[qtyIdx] || 1),
                    unitPrice: Number(row[purchasePriceIdx] || 0),
                    sellingPrice: Number(row[sellingPriceIdx] || (existingDef?.sellingPrice || 0)),
                    category: existingDef ? existingDef.category : 'Mattress', // Default category if new
                    sizeModel: '',
                };
            }).filter((item): item is NonNullable<typeof item> => item !== null);

            if (newItems.length > 0) {
                setInitialItems(newItems);
                setDialogOpen(true);
            } else {
                toast({ variant: 'default', title: "هیچ کاڵایەک نەدۆزرایەوە", description: "هیچ کاڵایەکی گونجاو لە فایلەکەدا نەبوو بۆ هاوردەکردن." });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        try {
            const sampleData = [{"ناوی کاڵا": "دۆشەکی نموونە", "دانە": 10, "نرخی کڕین": 150, "نرخی فرۆشتن": 250 }];
            const worksheet = XLSX.utils.json_to_sheet(sampleData);
            worksheet['!cols'] = [ { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 } ];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Template");
            XLSX.writeFile(workbook, "Purchase_Import_Template.xlsx");
            toast({ title: "سەرکەوتوو بوو", description: "فایلی نموونەی کڕین بە سەرکەوتوویی دابەزێنرا.", className: "bg-accent text-accent-foreground" });
        } catch (error) {
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "دابەزاندنی فایلی نموونە سەرکەوتوو نەبوو." });
        }
    };

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls"/>
             <div className="flex items-center gap-2">
                <PurchaseFormDialog formId={null} onSave={onSave} trigger={
                    <Button><PlusCircle /> پسوولەی کڕینی نوێ</Button>
                }/>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileUp className="ml-2 h-4 w-4" />}
                            هاوردەکردنی پسوولە
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => triggerUpload('ai')}>هاوردەکردنی زیرەک (AI)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => triggerUpload('standard')}>هاوردەکردنی ستاندارد</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={downloadTemplate} variant="outline"><FileDown className="ml-2 h-4 w-4" />دابەزاندنی نموونە</Button>
             </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-7xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>دروستکردنی پسوولەی کڕین لە فایل</DialogTitle>
                        <DialogDescription>وردبینی زانیارییەکان بکە و دابینکەر هەڵبژێرە، پاشان پاشەکەوتی بکە.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[80vh] overflow-y-auto p-2">
                        <BuyingForm formId={null} onSave={() => { onSave(); setDialogOpen(false); }} initialItems={initialItems} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function PurchasesList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);

    const buyingFormsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'buying_forms');
    }, [firestore, refreshKey]);

    const suppliersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'suppliers');
    }, [firestore]);

    const { data: buyingForms, isLoading: isLoadingForms } = useCollection<BuyingFormType>(buyingFormsQuery);
    const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersQuery);

    const handleFormSave = () => {
        setRefreshKey(prev => prev + 1); // Trigger a re-fetch
    };

    const enrichedForms = useMemo(() => {
        if (!buyingForms || !suppliers) return [];
        const supplierMap = new Map(suppliers.map(s => [s.id, s.supplierName]));
        return buyingForms.map(form => ({
            ...form,
            supplierName: supplierMap.get(form.supplierId) || 'Unknown Supplier',
            totalAmount: form.totalAmount || 0,
        }));
    }, [buyingForms, suppliers]);


    const handleDelete = async (formId: string) => {
        if (!firestore) return;

        try {
            await runTransaction(firestore, async (transaction) => {
                const productsPurchasedRef = collection(firestore, `buying_forms/${formId}/buying_form_products`);
                const productsPurchasedSnapshot = await getDocs(productsPurchasedRef); // This is a non-transactional read.
                
                const productRefsToUpdate: { ref: any; newQuantity: number }[] = [];
                
                const productSnapshots = await Promise.all(
                    productsPurchasedSnapshot.docs.map(productDoc => {
                        const item = productDoc.data() as BuyingFormProduct;
                        const productRef = doc(firestore, 'products', item.productId);
                        return transaction.get(productRef).then(snap => ({ snap, item }));
                    })
                );

                for (const { snap, item } of productSnapshots) {
                     if (snap.exists()) {
                        const newQuantity = (snap.data().currentQuantity || 0) - item.quantity;
                        productRefsToUpdate.push({ ref: snap.ref, newQuantity: newQuantity < 0 ? 0 : newQuantity });
                    }
                }

                productRefsToUpdate.forEach(({ ref, newQuantity }) => {
                    transaction.update(ref, { currentQuantity: newQuantity });
                });
                
                productsPurchasedSnapshot.docs.forEach(docToDelete => {
                    transaction.delete(docToDelete.ref);
                });

                const formRef = doc(firestore, 'buying_forms', formId);
                transaction.delete(formRef);
            });

            toast({
                title: "سەرکەوتوو بوو",
                description: "پسوولەی کڕین بە سەرکەوتوویی سڕایەوە و بڕی کاڵاکان لە کۆگا کەمکرایەوە.",
                className: "bg-accent text-accent-foreground",
            });
            handleFormSave();
        } catch (error: any) {
            console.error("Error deleting purchase form:", error);
            toast({
                variant: 'destructive',
                title: "هەڵەیەک ڕوویدا",
                description: error.message || "سڕینەوەی پسوولەی کڕین سەرکەوتوو نەبوو.",
            });
        }
    };


    const isLoading = isLoadingForms || isLoadingSuppliers;

    return (
         <Card>
            <CardHeader>
                <CardTitle>لیستی کڕینەکان</CardTitle>
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
                                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(form.totalAmount || 0)}
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
                                                <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم پسوولەیە؟</AlertDialogTitle>
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

                                        <PurchaseFormDialog 
                                            formId={form.id} 
                                            onSave={handleFormSave}
                                            trigger={
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                            }
                                        />

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
    const [refreshKey, setRefreshKey] = useState(0);
    const handleSave = () => setRefreshKey(prev => prev + 1);

    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی کڕینەکان" description="تۆماری پسوولەکانی کڕین لێرە ببینە و زیاد بکە.">
                <ImportActions onSave={handleSave} />
            </PageHeader>
            <PurchasesList />
        </div>
    );
}
