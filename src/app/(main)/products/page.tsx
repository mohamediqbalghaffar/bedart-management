'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, FileDown, FileUp, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, collection, writeBatch, doc, getDocs, query, where } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddProductForm } from './components/add-product-form';
import { EditableProductRow } from './components/editable-product-row';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCategory } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ProductDefinition = {
    productName: string;
    category: 'Mattress' | 'Bed' | 'Pillow' | 'Cover';
    sellingPrice?: number;
};

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];
const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
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
                { productName: "دۆشەکی نموونە", sellingPrice: 0 },
                { productName: "تەختی نموونە", sellingPrice: 0 },
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
                            <TableBody>{newProducts.map((p, i) => ( <TableRow key={i}><TableCell>{p.productName}</TableCell><TableCell>{categoryTranslations[p.category]}</TableCell><TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.sellingPrice || 0)}</TableCell></TableRow>))}</TableBody>
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
function ProductDefinitionsList({ products, isLoading, onProductUpdated, onBulkUpdate, searchTerm, onSearchTermChange }: {
    products: WithId<ProductDefinition>[] | null,
    isLoading: boolean,
    onProductUpdated: () => void,
    onBulkUpdate: (ids: string[], newCategory: ProductCategory) => Promise<void>,
    searchTerm: string,
    onSearchTermChange: (value: string) => void
}) {
    
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchTerm) return products;
        return products.filter(p => 
            p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedProducts(new Set());
        }
    };

    const handleSelectionChange = (id: string, isSelected: boolean) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleApplyBulkChange = (newCategory: ProductCategory) => {
        if (selectedProducts.size === 0) return;
        onBulkUpdate(Array.from(selectedProducts), newCategory).then(() => {
            setSelectedProducts(new Set());
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>لیستی پێناسەی کاڵاکان</CardTitle>
                 <div className="flex justify-between items-center gap-4 mt-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="...گەڕان"
                            className="pr-10"
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                        />
                    </div>
                    {selectedProducts.size > 0 && (
                        <div className="flex items-center gap-2">
                             <span>{selectedProducts.size} دانە هەڵبژێردراوە</span>
                             <Button variant="ghost" size="sm" onClick={() => setSelectedProducts(new Set())}>هەڵوەشاندنەوە</Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                 <div>
                    <ScrollArea className="h-[60vh] border rounded-lg">
                        <Table dir="rtl">
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow>
                                    <TableHead className="text-right w-[50%]">ناوی کاڵا</TableHead>
                                    <TableHead className="text-right w-[30%]">
                                        <div className="flex items-center gap-2 justify-end">
                                            {selectedProducts.size > 0 ? (
                                                <Select onValueChange={handleApplyBulkChange}>
                                                    <SelectTrigger className="w-[200px] border-dashed h-8">
                                                        <SelectValue placeholder="گۆڕینی پۆلی هەڵبژێردراو" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {productCategories.map(cat => (
                                                            <SelectItem key={cat} value={cat}>{categoryTranslations[cat]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span>پۆل</span>
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-left w-[20%]">کردارەکان</TableHead>
                                    <TableHead className="w-[50px] text-center">
                                         <Checkbox
                                            checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all rows"
                                        />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                                ) : !filteredProducts || filteredProducts.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">هیچ پێناسەیەکی کاڵا تۆمار نەکراوە.</TableCell></TableRow>
                                ) : (
                                    filteredProducts.map((product) => 
                                    <EditableProductRow 
                                        key={product.id} 
                                        product={product} 
                                        onProductUpdated={onProductUpdated}
                                        isSelected={selectedProducts.has(product.id)}
                                        onSelectionChange={handleSelectionChange} 
                                    />)
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

// Main page component that orchestrates everything
export default function ProductsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    
    const firestore = useFirestore();
    const definitionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'product_definitions');
    }, [firestore, refreshKey]);
    const { data: products, isLoading } = useCollection<ProductDefinition>(definitionsQuery);

    const handleSave = () => setRefreshKey(prev => prev + 1);

    const handleBulkUpdateCategory = async (ids: string[], newCategory: ProductCategory) => {
        if (!firestore || ids.length === 0) return;

        const { id: toastId, update: updateToast } = toast({ title: '...نوێکردنەوەی پۆلەکان', description: `Updating ${ids.length} products.` });
        
        try {
            const batch = writeBatch(firestore);
            
            const definitionsToUpdate = products?.filter(p => ids.includes(p.id)) || [];
            if (definitionsToUpdate.length === 0) throw new Error("No products found to update.");

            const productNamesToUpdate = [...new Set(definitionsToUpdate.map(p => p.productName))];

            // 1. Update the product_definitions
            definitionsToUpdate.forEach(def => {
                const defRef = doc(firestore, 'product_definitions', def.id);
                batch.update(defRef, { category: newCategory });
            });

            // 2. Query for all affected stock items in batches of 30 (Firestore 'in' query limit)
            const CHUNK_SIZE = 30;
            for (let i = 0; i < productNamesToUpdate.length; i += CHUNK_SIZE) {
                const chunk = productNamesToUpdate.slice(i, i + CHUNK_SIZE);
                if (chunk.length > 0) {
                    const stockQuery = query(collection(firestore, 'products'), where('productName', 'in', chunk));
                    const stockSnap = await getDocs(stockQuery);
                    stockSnap.forEach(stockDoc => {
                        batch.update(stockDoc.ref, { category: newCategory });
                    });
                }
            }

            await batch.commit();
            updateToast(toastId, { title: 'سەرکەوتوو بوو', description: 'پۆلەکان بە سەرکەوتوویی نوێکرانەوە.', className: 'bg-accent text-accent-foreground' });
            handleSave();
        } catch (error) {
            console.error("Error during bulk category update:", error);
            updateToast(toastId, { variant: "destructive", title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوەی پۆلەکان سەرکەوتوو نەبوو." });
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی ناوی کاڵاکان" description="پێناسەی کاڵا سەرەکییەکانت لێرە ببینە و زیاد بکە.">
                <div className="flex items-center gap-2">
                    <AddProductDialog onProductAdded={handleSave} />
                    <DownloadTemplateButton />
                    <UploadItemsButton onUploadSuccess={handleSave} existingProducts={products} />
                </div>
            </PageHeader>
            <ProductDefinitionsList 
                products={products} 
                isLoading={isLoading} 
                onProductUpdated={handleSave} 
                onBulkUpdate={handleBulkUpdateCategory}
                searchTerm={searchTerm} 
                onSearchTermChange={setSearchTerm} 
            />
        </div>
    );
}
