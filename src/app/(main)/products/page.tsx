'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileDown, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, collection, writeBatch, doc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddProductForm } from './components/add-product-form';
import { EditableProductRow } from './components/editable-product-row';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export type ProductDefinition = {
    productName: string;
    category: 'Mattress' | 'Bed' | 'Pillow' | 'Cover';
    sellingPrice?: number;
};

// Component to add a new product definition
function AddProductDialog({ onProductAdded }: { onProductAdded: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><PlusCircle />زیادکردنی کاڵای نوێ</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader><DialogTitle>کاڵای نوێ زیاد بکە</DialogTitle><DialogDescription>زانیارییەکانی کاڵا بنووسە بۆ دروستکردنی پێناسەیەکی نوێ.</DialogDescription></DialogHeader>
                <AddProductForm onProductAdded={() => { onProductAdded(); setOpen(false); }} />
            </DialogContent>
        </Dialog>
    );
}

// Component to download an Excel template
function DownloadTemplateButton() {
    const { toast } = useToast();
    const handleDownload = () => {
        try {
            const worksheet = XLSX.utils.json_to_sheet([
                { productName: "دۆشەکی نموونە", sellingPrice: 500 },
                { productName: "تەختی نموونە", sellingPrice: 800 },
            ]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
            worksheet['!cols'] = [ { wch: 25 }, { wch: 15 } ];
            XLSX.writeFile(workbook, "Product_Import_Template.xlsx");
            toast({ title: " سەرکەوتوو بوو", description: "فایلی نموونە بە سەرکەوتوویی دابەزێنرا.", className: "bg-accent text-accent-foreground"});
        } catch (error) {
            console.error("Failed to download template:", error);
            toast({ variant: "destructive", title: "هەڵەیەک ڕوویدا", description: "دابەزاندنی فایلی نموونە سەرکەوتوو نەبوو." });
        }
    };
    return <Button variant="outline" onClick={handleDownload}><FileDown className="mr-2 h-4 w-4" />دابەزاندنی نموونەی بەتاڵ</Button>;
}

// Component to upload items from an Excel file
function UploadItemsButton({ onUploadSuccess, existingProducts }: { onUploadSuccess: () => void, existingProducts: WithId<ProductDefinition>[] | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isParsing, setIsParsing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [newProducts, setNewProducts] = React.useState<ProductDefinition[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIsParsing(true);
        toast({ title: '...شیکردنەوەی فایل' });
        
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                    const productsFromSheet = jsonData.map(row => ({
                        productName: String(row.productName || row['ناوی کاڵا'] || ''),
                        sellingPrice: Number(row.sellingPrice) || Number(row['نرخی فرۆشتن']) || 0,
                    })).filter(p => p.productName);

                    if (productsFromSheet.length === 0) {
                        toast({ variant: 'default', title: "هیچ کاڵایەک نەدۆزرایەوە", description: "فایلەکە بەتاڵە یان ستوونی 'productName'ی تێدا نییە." });
                        return;
                    }
                    
                    const existingProductNames = new Set((existingProducts || []).map(p => p.productName.toLowerCase()));

                    const productsToUpload = productsFromSheet
                        .map(p => ({
                            productName: p.productName,
                            sellingPrice: p.sellingPrice,
                            category: 'Mattress', // Default category
                        }))
                        .filter(p => p.productName && !existingProductNames.has(p.productName.toLowerCase())) as ProductDefinition[];


                    if (productsToUpload.length > 0) {
                        setNewProducts(productsToUpload);
                        setIsDialogOpen(true);
                    } else {
                        toast({ variant: 'default', title: "هیچ کاڵایەکی نوێ نەدۆزرایەوە", description: "هەموو کاڵاکانی ناو فایلەکە پێشتر بوونیان هەیە." });
                    }
                } catch (parseError) {
                    console.error("Parsing error:", parseError);
                    toast({ variant: "destructive", title: "هەڵە لە شیکردنەوە", description: "نەتوانرا فایلەکە بخوێنرێتەوە." });
                } finally {
                    setIsParsing(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            toast({ variant: "destructive", title: "هەڵەیەک ڕوویدا", description: "پرۆسێسی فایلەکە سەرکەوتوو نەبوو." });
            setIsParsing(false);
        }
    };

    const handleSave = async () => {
        if (!firestore || newProducts.length === 0) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            newProducts.forEach(product => {
                const docRef = doc(collection(firestore, 'product_definitions'));
                batch.set(docRef, { ...product, id: docRef.id });
            });
            await batch.commit();
            toast({ title: 'سەرکەوتوو بوو', description: `${newProducts.length} کاڵای نوێ زیادکرا.`, className: 'bg-accent text-accent-foreground' });
            onUploadSuccess();
            setIsDialogOpen(false);
            setNewProducts([]);
        } catch (error) {
            console.error("Error saving new products:", error);
            toast({ variant: "destructive", title: "هەڵەیەک ڕوویدا", description: "پاشەکەوتکردنی کاڵاکان سەرکەوتوو نەبوو." });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                بارکردنی کاڵا
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent dir="rtl" className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>پشتڕاستکردنەوەی هاوردەکردن</DialogTitle><DialogDescription>ئەم کاڵا نوێیانە بۆ لیستی پێناسەکان زیاد دەکرێن.</DialogDescription></DialogHeader>
                    <div className="max-h-96 overflow-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>ناوی کاڵا</TableHead><TableHead>پۆل</TableHead><TableHead>نرخی فرۆشتن</TableHead></TableRow></TableHeader>
                            <TableBody>{newProducts.map((p, i) => ( <TableRow key={i}><TableCell>{p.productName}</TableCell><TableCell>{p.category}</TableCell><TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.sellingPrice || 0)}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}پاشەکەوتکردن</Button>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>پاشگەزبوونەوە</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Component to display the list of product definitions
function ProductDefinitionsList({ products, isLoading, onProductUpdated }: { products: WithId<ProductDefinition>[] | null, isLoading: boolean, onProductUpdated: () => void }) {
    return (
        <Card>
            <CardHeader><CardTitle>لیستی پێناسەی کاڵاکان</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead className="text-right">ناوی کاڵا</TableHead><TableHead className="text-right">پۆل</TableHead><TableHead className="text-right">نرخی فرۆشتن</TableHead><TableHead className="text-left">کردارەکان</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : !products || products.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">هیچ پێناسەیەکی کاڵا تۆمار نەکراوە.</TableCell></TableRow>
                        ) : (
                            products.map((product) => <EditableProductRow key={product.id} product={product} onProductUpdated={onProductUpdated} />)
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Main page component that orchestrates everything
export default function ProductsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleSave = () => setRefreshKey(prev => prev + 1);
    
    const firestore = useFirestore();
    const definitionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'product_definitions');
    }, [firestore, refreshKey]);
    const { data: products, isLoading } = useCollection<ProductDefinition>(definitionsQuery);

    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی ناوی کاڵاکان" description="پێناسەی کاڵا سەرەکییەکانت لێرە ببینە و زیاد بکە.">
                <div className="flex items-center gap-2">
                    <AddProductDialog onProductAdded={handleSave} />
                    <DownloadTemplateButton />
                    <UploadItemsButton onUploadSuccess={handleSave} existingProducts={products} />
                </div>
            </PageHeader>
            <ProductDefinitionsList products={products} isLoading={isLoading} onProductUpdated={handleSave} />
        </div>
    );
}
