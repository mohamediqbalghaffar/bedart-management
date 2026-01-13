
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFirestore, runTransaction, doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';

type Product = {
    productName: string;
    category: string;
    stockLocation: string;
    currentQuantity: number;
    supplierId?: string;
    sizeModel?: string;
    unitPrice?: number;
    sellingPrice?: number;
};

const transferSchema = z.object({
  quantity: z.coerce.number().min(1, "بڕی گواستنەوە دەبێت لانیکەم 1 بێت."),
});

type TransferFormValues = z.infer<typeof transferSchema>;

type StockTransferDialogProps = {
  product: WithId<Product>;
  children: React.ReactNode;
  onTransferSuccess: () => void;
};

export function StockTransferDialog({ product, children, onTransferSuccess }: StockTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { quantity: 1 },
  });

  const onSubmit = async (data: TransferFormValues) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'هەڵە', description: 'پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.' });
      return;
    }

    if (data.quantity > product.currentQuantity) {
      form.setError('quantity', { message: 'بڕی داواکراو لە بڕی بەردەست زیاترە.' });
      return;
    }

    const fromLocation = product.stockLocation;
    const toLocation = fromLocation === 'Warehouse' ? 'Shop Showroom' : 'Warehouse';
    const destinationProductId = product.id.replace(fromLocation.toLowerCase().replace(/\s/g, ''), toLocation.toLowerCase().replace(/\s/g, ''));


    try {
      await runTransaction(firestore, async (transaction) => {
        const sourceRef = doc(firestore, 'products', product.id);
        const destinationRef = doc(firestore, 'products', destinationProductId);
        
        const [sourceSnap, destinationSnap] = await Promise.all([
            transaction.get(sourceRef),
            transaction.get(destinationRef)
        ]);

        if (!sourceSnap.exists()) {
          throw new Error("Source product does not exist.");
        }
        
        // 1. Decrement source quantity
        const newSourceQuantity = sourceSnap.data().currentQuantity - data.quantity;
        transaction.update(sourceRef, { currentQuantity: newSourceQuantity });

        // 2. Increment destination quantity (or create if not exists)
        if (destinationSnap.exists()) {
          const newDestQuantity = destinationSnap.data().currentQuantity + data.quantity;
          transaction.update(destinationRef, { currentQuantity: newDestQuantity });
        } else {
            // Create a new product document for the destination
            const newProductData = {
                ...product, // copy all data
                id: destinationProductId,
                stockLocation: toLocation,
                currentQuantity: data.quantity,
            };
            delete (newProductData as any).supplierName;
            transaction.set(destinationRef, newProductData);
        }

        // 3. Log the movement
        const movementRef = doc(collection(firestore, 'stock_movements'));
        transaction.set(movementRef, {
            id: movementRef.id,
            productId: product.id,
            productName: product.productName,
            quantity: data.quantity,
            fromLocation: fromLocation,
            toLocation: toLocation,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            note: `Transfer from ${fromLocation} to ${toLocation}`,
        });
      });

      toast({
        title: 'سەرکەوتوو بوو',
        description: `گواستنەوەی ${data.quantity} دانە لە ${product.productName} ئەنجامدرا.`,
        className: 'bg-accent text-accent-foreground',
      });
      onTransferSuccess();
      setOpen(false);

    } catch (error) {
      console.error('Stock transfer failed:', error);
      toast({
        variant: 'destructive',
        title: 'هەڵەیەک ڕوویدا',
        description: 'گواستنەوەکە سەرکەوتوو نەبوو. تکایە دووبارە هەوڵبدەرەوە.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>گواستنەوەی کاڵا</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <p><span className='font-semibold'>کاڵا:</span> {product.productName}</p>
            <p><span className='font-semibold'>بڕی ئێستا:</span> {product.currentQuantity}</p>
            <p><span className='font-semibold'>شوێنی ئێستا:</span> {product.stockLocation === 'Warehouse' ? 'کۆگا' : 'فرۆشگا'}</p>
            <p><span className='font-semibold'>گواستنەوە بۆ:</span> {product.stockLocation === 'Warehouse' ? 'فرۆشگا' : 'کۆگا'}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بڕی گواستنەوە</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={product.currentQuantity} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                گواستنەوە
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                پاشگەزبوونەوە
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
