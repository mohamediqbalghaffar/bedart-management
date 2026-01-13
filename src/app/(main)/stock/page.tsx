
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

type Product = {
    productName: string;
    category: string;
    sizeModel?: string;
    stockLocation: string;
    currentQuantity: number;
    supplierId?: string;
};

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

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const enriched = products
            .filter(p => p.currentQuantity > 0)
            .map(p => ({
                ...p,
                supplierName: p.supplierId ? supplierMap.get(p.supplierId) : 'N/A',
            }));

        if (!searchTerm) return enriched;

        return enriched.filter(p =>
            p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sizeModel && p.sizeModel.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [products, searchTerm, supplierMap]);
    
    const isLoading = isLoadingProducts || isLoadingSuppliers;
    
    const exportToExcel = () => {
        if (!filteredProducts) return;
        toast({title: "...چاوەڕوانبە", description: `هەناردەکردنی ڕاپۆرتی کۆگا`})

        const dataToExport = filteredProducts.map(p => ({
            "ناوی کاڵا": p.productName,
            "پۆل": p.category,
            "قەبارە/مۆدێل": p.sizeModel || 'N/A',
            "دانە": p.currentQuantity,
            "شوێن": p.stockLocation === 'Warehouse' ? 'کۆگا' : 'فرۆشگا',
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">کاڵا</TableHead>
                            <TableHead className="text-right">پۆل</TableHead>
                            <TableHead className="text-right">دانە</TableHead>
                            <TableHead className="text-right">شوێن</TableHead>
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
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                    {searchTerm ? `هیچ کاڵایەک نەدۆزرایەوە بۆ "${searchTerm}"` : "هیچ کاڵایەک لە کۆگا نییە."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium text-right">{product.productName} {product.sizeModel && `(${product.sizeModel})`}</TableCell>
                                    <TableCell className="text-right">{product.category}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={product.currentQuantity < 5 ? "destructive" : "secondary"}>
                                            {product.currentQuantity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{product.stockLocation === 'Warehouse' ? 'کۆگا' : 'فرۆشگا'}</TableCell>
                                    <TableCell className="text-right">{product.supplierName}</TableCell>
                                    <TableCell className="text-center">
                                       <StockTransferDialog product={product} onTransferSuccess={onTransferSuccess}>
                                            <Button variant="ghost" size="icon">
                                                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                                            </Button>
                                       </StockTransferDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
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
