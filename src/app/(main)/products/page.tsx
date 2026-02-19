
'use client';

import React, { useState, useRef } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, collection, writeBatch, doc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddProductForm } from './components/add-product-form';
import { EditableProductRow } from './components/editable-product-row';
import { useToast } from '@/hooks/use-toast';
import { analyzePurchaseExcel } from '@/ai/flows/analyze-purchase-excel';
import { analyzeSqlExport } from '@/ai/flows/analyze-sql-export';

export type ProductDefinition = {
    productName: string;
    category: 'Mattress' | 'Bed' | 'Pillow' | 'Cover';
    sellingPrice?: number;
};

function AddProductDialog({ onProductAdded }: { onProductAdded: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle />
                    زیادکردنی کاڵای نوێ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>کاڵای نوێ زیاد بکە</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی کاڵا بنووسە بۆ دروستکردنی پێناسەیەکی نوێ.
                    </DialogDescription>
                </DialogHeader>
                <AddProductForm onProductAdded={() => {
                    onProductAdded();
                    setOpen(false);
                }} />
            </DialogContent>
        </Dialog>
    );
}

function UploadProductsButton({ onUploadComplete }: { onUploadComplete: () => void }) {
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [productsToAdd, setProductsToAdd] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const firestore = useFirestore();

    const definitionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'product_definitions');
    }, [firestore]);
    const { data: existingDefinitions } = useCollection<ProductDefinition>(definitionsQuery);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        toast({ title: '...شیکردنەوەی فایل' });

        try {
            let extractedRecords: { productName: string; category: any; }[] = [];

            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                const dataUri = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => e.target?.result ? resolve(e.target.result as string) : reject(new Error("Failed to read file."));
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                const result = await analyzePurchaseExcel({ 
                    documentDataUri: dataUri, 
                    existingProductNames: existingDefinitions?.map(d => d.productName) || [] 
                });
                extractedRecords = result.map(item => ({
                    productName: item.product,
                    category: item.category,
                }));

            } else if (['text/plain', 'text/csv', 'application/json'].includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
                const textData = await file.text();
                let csvData = textData;

                if(file.type === 'application/json') {
                    const jsonData = JSON.parse(textData);
                    if (Array.isArray(jsonData) && jsonData.length > 0) {
                        const headers = Object.keys(jsonData[0]);
                        const csvHeader = headers.join(',');
                        const csvRows = jsonData.map(row => headers.map(header => {
                            const val = row[header];
                            if (typeof val === 'string' && val.includes(',')) {
                                return `"${val}"`;
                            }
                            return val;
                        }).join(','));
                        csvData = [csvHeader, ...csvRows].join('\n');
                    } else {
                        throw new Error("JSON فایلەکە دەبێت ئەڕایەک بێت لە ئۆبجێکت.");
                    }
                }
                
                const result = await analyzeSqlExport({ csvData: csvData });
                
                if (result.products) {
                    extractedRecords = result.products;
                } else if (result.customers || result.suppliers) {
                    const detectedType = result.customers ? 'customers' : 'suppliers';
                    throw new Error(`AI داتاکانی وەک ${detectedType} ناسییەوە، نەک وەک کاڵا.`);
                } else {
                     throw new Error("AI could not identify any product data in the file.");
                }

            } else {
                throw new Error("جۆری فایلەکە پشتگیری نەکراوە.");
            }
            
            if (extractedRecords.length === 0) {
                toast({ title: "هیچ کاڵایەکی نوێ نەدۆزرایەوە", description: "هیچ کاڵایەکی گونجاو لە فایلەکەدا نەبوو بۆ زیادکردن." });
                return;
            }

            const existingNames = new Set(existingDefinitions?.map(d => d.productName.toLowerCase()) || []);
            const uniqueNewProducts = new Map<string, any>();

            extractedRecords.forEach(item => {
                const lowerCaseName = item.productName.toLowerCase();
                if (!existingNames.has(lowerCaseName) && !uniqueNewProducts.has(lowerCaseName)) {
                    uniqueNewProducts.set(lowerCaseName, {
                        productName: item.productName,
                        category: item.category,
                        sellingPrice: 0,
                    });
                }
            });

            const finalProductsToAdd = Array.from(uniqueNewProducts.values());

            if (finalProductsToAdd.length > 0) {
                setProductsToAdd(finalProductsToAdd);
                setDialogOpen(true);
            } else {
                toast({ title: "هیچ کاڵایەکی نوێ نەدۆزرایەوە", description: "هەموو کاڵاکانی ناو فایلەکە پێشتر تۆمارکراون." });
            }

        } catch (error: any) {
            console.error("File processing error:", error);
            const errorMessage = error.message || "شیکردنەوەی فایلەکە سەرکەوتوو نەبوو.";
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: errorMessage });
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleConfirmAdd = async () => {
        if (!firestore || productsToAdd.length === 0) return;
        
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            productsToAdd.forEach(productData => {
                const docRef = doc(collection(firestore, 'product_definitions'));
                batch.set(docRef, { ...productData, id: docRef.id });
            });

            await batch.commit();

            toast({ title: 'سەرکەوتوو بوو', description: `${productsToAdd.length} پێناسەی کاڵای نوێ زیادکرا.`, className: 'bg-accent text-accent-foreground' });
            setDialogOpen(false);
            onUploadComplete();
        } catch (error) {
            console.error("Error saving new products:", error);
            toast({ variant: 'destructive', title: 'هەڵە', description: 'پاشەکەوتکردنی کاڵاکان سەرکەوتوو نەبوو.' });
        } finally {
            setIsSaving(false);
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
                accept="image/jpeg,image/png,application/pdf,text/plain,application/json,.csv,.txt"
            />
            <Button onClick={triggerUpload} disabled={isParsing} variant="outline">
                {isParsing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileUp />}
                هاوردەکردنی کاڵا
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>دڵنیابوونەوە لە زیادکردنی کاڵا</DialogTitle>
                        <DialogDescription>
                            ئەم کاڵا نوێیانە بۆ لیستی پێناسەکان زیاد دەکرێن.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">ناوی کاڵا</TableHead>
                                    <TableHead className="text-right">پۆل</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsToAdd.map(p => (
                                    <TableRow key={p.productName}>
                                        <TableCell>{p.productName}</TableCell>
                                        <TableCell>{p.category}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleConfirmAdd} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            دڵنیام و زیادیان بکە
                        </Button>
                         <Button variant="outline" onClick={() => setDialogOpen(false)}>پاشگەزبوونەوە</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ProductDefinitionsList() {
    const firestore = useFirestore();
    const [refreshKey, setRefreshKey] = useState(0);

    const definitionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'product_definitions');
    }, [firestore, refreshKey]);

    const { data: products, isLoading } = useCollection<ProductDefinition>(definitionsQuery);

    const handleProductChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>لیستی پێناسەی کاڵاکان</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ناوی کاڵا</TableHead>
                            <TableHead className="text-right">پۆل</TableHead>
                            <TableHead className="text-right">نرخی فرۆشتن</TableHead>
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
                        ) : !products || products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">هیچ پێناسەیەکی کاڵا تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <EditableProductRow key={product.id} product={product} onProductUpdated={handleProductChange} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function ProductsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleSave = () => setRefreshKey(prev => prev + 1);

    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی ناوی کاڵاکان" description="پێناسەی کاڵا سەرەکییەکانت لێرە ببینە و زیاد بکە.">
                <div className="flex items-center gap-2">
                    <AddProductDialog onProductAdded={handleSave} />
                    <UploadProductsButton onUploadComplete={handleSave} />
                </div>
            </PageHeader>
            <ProductDefinitionsList />
        </div>
    );
}
