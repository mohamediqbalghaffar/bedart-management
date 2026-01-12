
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type Product = {
  productName: string;
  currentQuantity: number;
  unitPrice?: number;
};

type ProductSelectorDialogProps = {
  onProductSelect: (product: { name: string; price: number }) => void;
};

export function ProductSelectorDialog({ onProductSelect }: ProductSelectorDialogProps) {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    const availableProducts = products.filter(p => p.currentQuantity > 0);

    if (!searchTerm) {
      return availableProducts;
    }
    
    return availableProducts.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const handleSelect = (product: WithId<Product>) => {
    onProductSelect({
      name: product.productName,
      price: product.unitPrice || 0,
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="...گەڕان"
          className="pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="h-72" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">ناوی کاڵا</TableHead>
              <TableHead className="text-right">دانە</TableHead>
              <TableHead className="text-left"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  هیچ کاڵایەک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="text-right font-medium">{product.productName}</TableCell>
                  <TableCell className="text-right">{product.currentQuantity}</TableCell>
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
