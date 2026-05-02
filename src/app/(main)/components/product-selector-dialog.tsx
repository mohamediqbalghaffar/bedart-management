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
    id: string;
    productName: string;
    sizeModel?: string;
    currentQuantity: number;
    unitPrice?: number; // purchase price
    sellingPrice?: number;
}

type EnrichedProduct = {
    id: string; // Combined ID for the list
    productName: string;
    sizeModel?: string;
    category: ProductCategory;
    sellingPrice?: number;
    currentQuantity: number;
    purchasePrice?: number;
}

type ProductSelectorDialogProps = {
  onProductSelect: (product: { name: string; sizeModel?: string; price: number, purchasePrice?: number, category: ProductCategory, productId?: string }) => void;
  filterByStock?: boolean;
};

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];

const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};


export function ProductSelectorDialog({ onProductSelect, filterByStock = true }: ProductSelectorDialogProps) {
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
    const combinedMap = new Map<string, EnrichedProduct>();

    // First add all definitions as base generic items (no size model)
    if (definitions) {
        definitions.forEach(def => {
            const key = `${def.productName}||`;
            combinedMap.set(key, {
                id: key,
                productName: def.productName,
                sizeModel: "",
                category: def.category,
                sellingPrice: def.sellingPrice,
                currentQuantity: 0,
            });
        });
    }

    // Then layer on real stock data, grouping by product and size
    if (stock) {
        stock.forEach(s => {
            const key = `${s.productName}||${s.sizeModel || ""}`;
            if (combinedMap.has(key)) {
                const existing = combinedMap.get(key)!;
                existing.currentQuantity += s.currentQuantity;
                if (s.unitPrice) existing.purchasePrice = s.unitPrice;
                if (s.sellingPrice) existing.sellingPrice = s.sellingPrice;
            } else {
                combinedMap.set(key, {
                    id: key,
                    productName: s.productName,
                    sizeModel: s.sizeModel || "",
                    category: "Mattress", // Fallback, though products should have category
                    sellingPrice: s.sellingPrice,
                    purchasePrice: s.unitPrice,
                    currentQuantity: s.currentQuantity,
                });
            }
        });
    }

    let enriched = Array.from(combinedMap.values());

    if (categoryFilter !== 'all') {
        enriched = enriched.filter(p => p.category === categoryFilter);
    }
    if (searchTerm) {
      enriched = enriched.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.sizeModel && p.sizeModel.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterByStock) {
        return enriched.filter(p => p.currentQuantity > 0);
    }
    
    return enriched;
    
  }, [definitions, stock, searchTerm, categoryFilter, filterByStock]);
  
  const isLoading = isLoadingDefs || isLoadingStock;

  const handleSelect = (product: EnrichedProduct) => {
    onProductSelect({
      name: product.productName,
      sizeModel: product.sizeModel,
      price: product.sellingPrice || 0,
      purchasePrice: product.purchasePrice || 0,
      category: product.category,
      productId: product.id,
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
                  <TableCell className="text-right font-medium">
                    {product.productName}
                    {product.sizeModel && <span className="ml-2 text-sm text-muted-foreground">({product.sizeModel})</span>}
                  </TableCell>
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
