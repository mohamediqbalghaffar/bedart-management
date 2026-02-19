'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCategory } from '@/lib/types';

type ProductDefinition = {
  productName: string;
  category: ProductCategory;
  sellingPrice?: number;
};

type ProductStock = {
    productName: string;
    currentQuantity: number;
    unitPrice?: number; // purchase price
}

type EnrichedProduct = WithId<ProductDefinition> & {
    currentQuantity: number;
    purchasePrice?: number;
}

type ProductSelectorDialogProps = {
  onProductSelect: (product: { name: string; price: number, purchasePrice?: number, category: ProductCategory }) => void;
};

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];

const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};


export function ProductSelectorDialog({ onProductSelect }: ProductSelectorDialogProps) {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');

  const definitionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'product_definitions');
  }, [firestore]);

  const stockQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: definitions, isLoading: isLoadingDefs } = useCollection<ProductDefinition>(definitionsQuery);
  const { data: stock, isLoading: isLoadingStock } = useCollection<ProductStock>(stockQuery);

  const enrichedProducts = useMemo(() => {
    if (!definitions || !stock) return [];

    const stockMap = new Map<string, { totalQuantity: number, lastPurchasePrice?: number }>();
    stock.forEach(s => {
        const current = stockMap.get(s.productName) || { totalQuantity: 0 };
        current.totalQuantity += s.currentQuantity;
        if(s.unitPrice) {
            current.lastPurchasePrice = s.unitPrice;
        }
        stockMap.set(s.productName, current);
    });
    
    let enriched: EnrichedProduct[] = definitions.map(def => {
        const stockInfo = stockMap.get(def.productName);
        return {
            ...def,
            currentQuantity: stockInfo?.totalQuantity || 0,
            purchasePrice: stockInfo?.lastPurchasePrice,
        }
    });

    if (categoryFilter !== 'all') {
        enriched = enriched.filter(p => p.category === categoryFilter);
    }
    if (searchTerm) {
      enriched = enriched.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return enriched.filter(p => p.currentQuantity > 0);
    
  }, [definitions, stock, searchTerm, categoryFilter]);
  
  const isLoading = isLoadingDefs || isLoadingStock;

  const handleSelect = (product: EnrichedProduct) => {
    onProductSelect({
      name: product.productName,
      price: product.sellingPrice || 0,
      purchasePrice: product.purchasePrice || 0,
      category: product.category,
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
            <div className="relative col-span-2 sm:col-span-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="...گەڕان بەدوای کاڵا"
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select dir="rtl" value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
                <SelectTrigger><SelectValue placeholder="فلتەر بەپێی پۆل" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">هەموو پۆلەکان</SelectItem>
                    {productCategories.map(cat => <SelectItem key={cat} value={cat}>{categoryTranslations[cat]}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      <ScrollArea className="h-[450px]" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">ناوی کاڵا</TableHead>
              <TableHead className="text-right">نرخی فرۆشتن</TableHead>
              <TableHead className="text-right">دانە</TableHead>
              <TableHead className="text-right">پۆل</TableHead>
              <TableHead className="text-left"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : enrichedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  هیچ کاڵایەک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              enrichedProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="text-right font-medium">{product.productName}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.sellingPrice || 0)}</TableCell>
                  <TableCell className="text-right">{product.currentQuantity}</TableCell>
                  <TableCell className="text-right">{categoryTranslations[product.category] || product.category}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="sm" onClick={() => handleSelect(product)}>
                      هەڵبژاردن
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
