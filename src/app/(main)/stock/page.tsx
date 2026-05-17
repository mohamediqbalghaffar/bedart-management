'use client';

import React, { useState, useMemo, useEffect, Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileDown, Search, Loader2, Info, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { StockTransferDialog } from './components/stock-transfer-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfidentialBlur } from '@/components/shared/confidential-blur';
import { Separator } from '@/components/ui/separator';

type Product = {
    productName: string;
    category: string;
    sizeModel?: string;
    stockLocation: 'Warehouse' | 'Shop Showroom';
    currentQuantity: number;
    supplierId?: string;
};

type GroupedProduct = {
    productName: string;
    category: string;
    sizeModel?: string;
    supplierName: string;
    supplierId?: string;
    locations: {
        Warehouse?: WithId<Product>;
        'Shop Showroom'?: WithId<Product>;
    };
    totalQuantity: number;
}

type Supplier = {
    supplierName: string;
};

const categoryTranslations: Record<string, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};


function StockPageContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const { toast } = useToast();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showDepleted, setShowDepleted] = useState(false);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'products');
    }, [firestore, refreshTrigger]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const suppliersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'suppliers');
    }, [firestore]);
    const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersQuery);
    
    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

    const supplierMap = useMemo(() => {
        if (!suppliers) return new Map();
        return new Map(suppliers.map(s => [s.id, s.supplierName]));
    }, [suppliers]);

    const groupedProducts = useMemo(() => {
        if (!products) return [];
        
        const productMap = new Map<string, GroupedProduct>();

        products
            .filter(p => showDepleted ? true : p.currentQuantity > 0)
            .forEach(p => {
                const key = `${p.productName}-${p.sizeModel || ''}`;
                if (!productMap.has(key)) {
                    productMap.set(key, {
                        productName: p.productName,
                        category: p.category,
                        sizeModel: p.sizeModel,
                        supplierName: p.supplierId ? supplierMap.get(p.supplierId) || 'نەزانراو' : 'نەزانراو',
                        supplierId: p.supplierId,
                        locations: {},
                        totalQuantity: 0,
                    });
                }

                const grouped = productMap.get(key)!;
                grouped.locations[p.stockLocation] = p;
                grouped.totalQuantity += p.currentQuantity;
                if(p.supplierId) {
                    grouped.supplierId = p.supplierId;
                    grouped.supplierName = supplierMap.get(p.supplierId) || 'نەزانراو';
                }
            });
        
        const groupedArray = Array.from(productMap.values());

        if (!searchTerm) return groupedArray;

        return groupedArray.filter(p =>
            p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sizeModel && p.sizeModel.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm, supplierMap]);
    
    const isLoading = isLoadingProducts || isLoadingSuppliers;
    
    const exportToExcel = () => {
        if (!groupedProducts) return;
        toast({title: "...چاوەڕوانبە", description: `هەناردەکردنی ڕاپۆرتی کۆگا`})

        const dataToExport = groupedProducts.map(p => ({
            "ناوی کاڵا": p.productName,
            "پۆل": p.category,
            "قەبارە/مۆدێل": p.sizeModel || 'نەزانراو',
            "کۆگا": p.locations.Warehouse?.currentQuantity || 0,
            "فرۆشگا": p.locations['Shop Showroom']?.currentQuantity || 0,
            "کۆی گشتی": p.totalQuantity,
            "دابینکەر": p.supplierName,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
        XLSX.writeFile(workbook, `Stock_Report.xlsx`);
        
        toast({title: "سەرکەوتوو بوو", description: `ڕاپۆرتی کۆگا بەسەرکەوتوویی هەناردەکرا.`})
    }

    const onTransferSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    }
    
    return (
        <div className="p-4 md:p-8 space-y-8 overflow-x-hidden" dir="rtl">
            <PageHeader title="بەڕێوەبردنی کۆگا" description="ئاستی کۆگا و زانیاری کاڵاکانت لێرە بەڕێوەببە." />
            <Card className="w-full overflow-hidden">
                <CardHeader>
                    <CardTitle>لیستی کۆگا</CardTitle>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="...گەڕان بەدوای کاڵا"
                                className="pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={exportToExcel} className="flex-1 sm:flex-initial">
                                <FileDown className="mr-2 h-4 w-4" />
                                هەناردەکردنی ڕاپۆرت
                            </Button>
                            <Button
                                variant={showDepleted ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setShowDepleted(prev => !prev)}
                                className="flex-1 sm:flex-initial"
                            >
                                {showDepleted ? "بینینی هەموو" : "تەواوبووەکانیش"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <ScrollArea className="h-[60vh] hidden md:block border rounded-md">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow>
                                    <TableHead className="text-center">گواستنەوە</TableHead>
                                    <TableHead className="text-right">
                                        <div className='flex items-center justify-end gap-1'>
                                            <span>دابینکەر</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3 w-3 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>کۆتا دابینکەر کە ئەم کاڵایەی لێ کڕاوە</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center">کۆی گشتی</TableHead>
                                    <TableHead className="text-center">فرۆشگا</TableHead>
                                    <TableHead className="text-center">کۆگا</TableHead>
                                    <TableHead className="text-right">پۆل</TableHead>
                                    <TableHead className="text-right">کاڵا</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : groupedProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            {searchTerm ? `هیچ کاڵایەک نەدۆزرایەوە بۆ "${searchTerm}"` : "هیچ کاڵایەک لە کۆگا نییە."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    groupedProducts.map((product) => (
                                        <TableRow key={`${product.productName}-${product.sizeModel}`}>
                                            <TableCell className="text-center">
                                                <StockTransferDialog product={product} onTransferSuccess={onTransferSuccess}>
                                                    <Button variant="ghost" size="icon" disabled={!product.locations.Warehouse && !product.locations['Shop Showroom']}>
                                                        <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                </StockTransferDialog>
                                            </TableCell>
                                            <TableCell className="text-right">{product.supplierName}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={product.totalQuantity < 5 ? "destructive" : "secondary"}>
                                                    <ConfidentialBlur>{product.totalQuantity}</ConfidentialBlur>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center"><ConfidentialBlur>{product.locations['Shop Showroom']?.currentQuantity || 0}</ConfidentialBlur></TableCell>
                                            <TableCell className="text-center"><ConfidentialBlur>{product.locations.Warehouse?.currentQuantity || 0}</ConfidentialBlur></TableCell>
                                            <TableCell className="text-right">{categoryTranslations[product.category as keyof typeof categoryTranslations] || product.category}</TableCell>
                                            <TableCell className="font-medium text-right">{product.productName} {product.sizeModel && `(${product.sizeModel})`}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                        ) : groupedProducts.length === 0 ? (
                             <div className="py-8 text-center text-muted-foreground">
                                {searchTerm ? `هیچ کاڵایەک نەدۆزرایەوە بۆ "${searchTerm}"` : "هیچ کاڵایەک لە کۆگا نییە."}
                            </div>
                        ) : (
                            <ScrollArea className="h-[calc(100vh-320px)] w-full px-4 pb-4">
                                <div className="space-y-3">
                                    {groupedProducts.map((product) => (
                                            <Card key={`${product.productName}-${product.sizeModel}`} className="bg-card/80 w-full overflow-hidden border-accent/20">
                                            <CardHeader className="p-3 pb-1">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-sm break-words line-clamp-2 font-bold" title={`${product.productName}${product.sizeModel ? ` (${product.sizeModel})` : ''}`}>{product.productName} {product.sizeModel && `(${product.sizeModel})`}</CardTitle>
                                                        <CardDescription className="text-[10px] opacity-80">{categoryTranslations[product.category as keyof typeof categoryTranslations] || product.category}</CardDescription>
                                                    </div>
                                                        <StockTransferDialog product={product} onTransferSuccess={onTransferSuccess}>
                                                        <Button variant="ghost" size="sm" disabled={!product.locations.Warehouse && !product.locations['Shop Showroom']} className="h-7 w-7 p-0 shrink-0">
                                                            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
                                                        </Button>
                                                    </StockTransferDialog>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0 space-y-1.5 text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground text-[10px]">دابینکەر:</span>
                                                    <span className="font-medium truncate ml-2 text-[11px]">{product.supplierName}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-muted-foreground mb-0.5">کۆگا</span>
                                                        <ConfidentialBlur><Badge variant="secondary" className="w-full justify-center h-6 text-[11px] font-semibold">{product.locations.Warehouse?.currentQuantity || 0}</Badge></ConfidentialBlur>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-muted-foreground mb-0.5">فرۆشگا</span>
                                                        <ConfidentialBlur><Badge variant="secondary" className="w-full justify-center h-6 text-[11px] font-semibold">{product.locations['Shop Showroom']?.currentQuantity || 0}</Badge></ConfidentialBlur>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center font-bold pt-1.5 border-t mt-1 border-accent/10">
                                                    <span className="text-[11px]">کۆی گشتی:</span>
                                                    <ConfidentialBlur>
                                                        <Badge variant={product.totalQuantity < 5 ? "destructive" : "default"} className={product.totalQuantity >= 5 ? "bg-primary/90 h-6 px-2 text-[11px]" : "h-6 px-2 text-[11px]"}>
                                                            {product.totalQuantity}
                                                        </Badge>
                                                    </ConfidentialBlur>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function StockPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    return (
        <Suspense>
            <StockPageContent />
        </Suspense>
    )
}
