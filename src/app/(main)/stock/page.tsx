
'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function StockList() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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

    const supplierMap = useMemo(() => {
        if (!suppliers) return new Map();
        return new Map(suppliers.map(s => [s.id, s.supplierName]));
    }, [suppliers]);

    const groupedProducts = useMemo(() => {
        if (!products) return [];
        
        const productMap = new Map<string, GroupedProduct>();

        products
            .filter(p => p.currentQuantity > 0)
            .forEach(p => {
                const key = `${p.productName}-${p.sizeModel || ''}`;
                if (!productMap.has(key)) {
                    productMap.set(key, {
                        productName: p.productName,
                        category: p.category,
                        sizeModel: p.sizeModel,
                        supplierName: p.supplierId ? supplierMap.get(p.supplierId) || 'N/A' : 'N/A',
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
                    grouped.supplierName = supplierMap.get(p.supplierId) || 'N/A';
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
            "قەبارە/مۆدێل": p.sizeModel || 'N/A',
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
        <Card>
            <CardHeader>
                <CardTitle>لیستی کۆگا</CardTitle>
                <div className="flex items-center justify-between gap-4 mt-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="گەڕان بۆ کاڵایەک..."
                            className="pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={exportToExcel}>
                        <FileDown />
                        هەناردەکردنی ڕاپۆرت
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">کاڵا</TableHead>
                                <TableHead className="text-right">پۆل</TableHead>
                                <TableHead className="text-center">کۆگا</TableHead>
                                <TableHead className="text-center">فرۆشگا</TableHead>
                                <TableHead className="text-center">کۆی گشتی</TableHead>
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
                                <TableHead className="text-center">گواستنەوە</TableHead>
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
                                        <TableCell className="font-medium text-right">{product.productName} {product.sizeModel && `(${product.sizeModel})`}</TableCell>
                                        <TableCell className="text-right">{product.category}</TableCell>
                                        <TableCell className="text-center">{product.locations.Warehouse?.currentQuantity || 0}</TableCell>
                                        <TableCell className="text-center">{product.locations['Shop Showroom']?.currentQuantity || 0}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={product.totalQuantity < 5 ? "destructive" : "secondary"}>
                                                {product.totalQuantity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{product.supplierName}</TableCell>
                                        <TableCell className="text-center">
                                        <StockTransferDialog product={product} onTransferSuccess={onTransferSuccess}>
                                                <Button variant="ghost" size="icon" disabled={!product.locations.Warehouse && !product.locations['Shop Showroom']}>
                                                    <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                                                </Button>
                                        </StockTransferDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function StockPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی کۆگا" description="بەدواداچوون بۆ ئاستی کۆگا و نرخی کاڵاکان." />
            <StockList />
        </div>
    );
}

