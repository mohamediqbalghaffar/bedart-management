
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
import { ProductCategory, StockLocation } from '@/lib/types';

type Product = {
  productName: string;
  currentQuantity: number;
  unitPrice?: number;
  sellingPrice?: number;
  category: ProductCategory;
  stockLocation: StockLocation;
};

type ProductSelectorDialogProps = {
  onProductSelect: (product: { name: string; price: number, purchasePrice?: number, category: ProductCategory }) => void;
};

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];
const stockLocations: StockLocation[] = ["Warehouse", "Shop Showroom"];

const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};

const locationTranslations: Record<StockLocation, string> = {
  Warehouse: "کۆگا",
  "Shop Showroom": "فرۆشگا",
};

export function ProductSelectorDialog({ onProductSelect }: ProductSelectorDialogProps) {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<StockLocation | 'all'>('all');

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let availableProducts = products.filter(p => p.currentQuantity > 0);

    if (categoryFilter !== 'all') {
        availableProducts = availableProducts.filter(p => p.category === categoryFilter);
    }
    if (locationFilter !== 'all') {
        availableProducts = availableProducts.filter(p => p.stockLocation === locationFilter);
    }
    if (searchTerm) {
      availableProducts = availableProducts.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return availableProducts;
  }, [products, searchTerm, categoryFilter, locationFilter]);

  const handleSelect = (product: WithId<Product>) => {
    onProductSelect({
      name: product.productName,
      price: product.sellingPrice || 0,
      purchasePrice: product.unitPrice || 0,
      category: product.category,
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" dir="rtl">
            <div className="relative col-span-3 sm:col-span-1">
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
             <Select dir="rtl" value={locationFilter} onValueChange={(value) => setLocationFilter(value as any)}>
                <SelectTrigger><SelectValue placeholder="فلتەر بەپێی شوێن" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">هەموو شوێنەکان</SelectItem>
                    {stockLocations.map(loc => <SelectItem key={loc} value={loc}>{locationTranslations[loc]}</SelectItem>)}
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
              <TableHead className="text-right">شوێن</TableHead>
              <TableHead className="text-left"></TableHead>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  هیچ کاڵایەک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="text-right font-medium">{product.productName}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.sellingPrice || 0)}</TableCell>
                  <TableCell className="text-right">{product.currentQuantity}</TableCell>
                  <TableCell className="text-right">{categoryTranslations[product.category] || product.category}</TableCell>
                  <TableCell className="text-right">{locationTranslations[product.stockLocation] || product.stockLocation}</TableCell>
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

    