
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFirestore, runTransaction, doc, getDoc, setDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Product = {
    productName: string;
    category: string;
    stockLocation: 'Warehouse' | 'Shop Showroom';
    currentQuantity: number;
    supplierId?: string;
    sizeModel?: string;
    unitPrice?: number;
    sellingPrice?: number;
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

const transferSchema = z.object({
  quantity: z.coerce.number().min(1, "بڕی گواستنەوە دەبێت لانیکەم 1 بێت."),
  source: z.enum(['Warehouse', 'Shop Showroom'], { required_error: 'دەبێت شوێنێکی سەرچاوە هەڵبژێریت.' }),
});

type TransferFormValues = z.infer<typeof transferSchema>;

type StockTransferDialogProps = {
  product: GroupedProduct;
  children: React.ReactNode;
  onTransferSuccess: () => void;
};

export function StockTransferDialog({ product, children, onTransferSuccess }: StockTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { 
        quantity: 1,
        source: product.locations.Warehouse ? 'Warehouse' : 'Shop Showroom'
    },
  });

  const watchedSource = form.watch('source');
  const maxQuantity = product.locations[watchedSource]?.currentQuantity || 0;


  const onSubmit = async (data: TransferFormValues) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'هەڵە', description: 'پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.' });
      return;
    }
    
    const sourceProduct = product.locations[data.source];
    if (!sourceProduct) {
        toast({ variant: 'destructive', title: 'هەڵە', description: 'کاڵای سەرچاوە بوونی نییە.' });
        return;
    }

    if (data.quantity > sourceProduct.currentQuantity) {
      form.setError('quantity', { message: 'بڕی داواکراو لە بڕی بەردەست زیاترە.' });
      return;
    }

    const toLocation = data.source === 'Warehouse' ? 'Shop Showroom' : 'Warehouse';
    const destinationProductId = sourceProduct.id.replace(data.source.toLowerCase().replace(/\s/g, ''), toLocation.toLowerCase().replace(/\s/g, ''));

    try {
      await runTransaction(firestore, async (transaction) => {
        const sourceRef = doc(firestore, 'products', sourceProduct.id);
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
            const newProductData = {
                ...sourceProduct, 
                id: destinationProductId,
                stockLocation: toLocation,
                currentQuantity: data.quantity,
            };
            transaction.set(destinationRef, newProductData);
        }

        // 3. Log the movement
        const movementRef = doc(firestore, 'stock_movements', `mov-${Date.now()}`);
        transaction.set(movementRef, {
            id: movementRef.id,
            productId: sourceProduct.id,
            productName: sourceProduct.productName,
            quantity: data.quantity,
            fromLocation: data.source,
            toLocation: toLocation,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            note: `Transfer from ${data.source} to ${toLocation}`,
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
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>گواستنەوە لە</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                        >
                        {product.locations.Warehouse && (
                             <FormItem className="flex items-center space-x-2 space-x-reverse">
                                <FormControl>
                                    <RadioGroupItem value="Warehouse" id="warehouse" />
                                </FormControl>
                                <FormLabel htmlFor="warehouse">
                                    کۆگا (بەردەست: {product.locations.Warehouse.currentQuantity})
                                </FormLabel>
                            </FormItem>
                        )}
                        {product.locations['Shop Showroom'] && (
                             <FormItem className="flex items-center space-x-2 space-x-reverse">
                                <FormControl>
                                    <RadioGroupItem value="Shop Showroom" id="shop" />
                                </FormControl>
                                <FormLabel htmlFor="shop">
                                    فرۆشگا (بەردەست: {product.locations['Shop Showroom'].currentQuantity})
                                </FormLabel>
                            </FormItem>
                        )}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بڕی گواستنەوە</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={maxQuantity} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || maxQuantity === 0}>
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
