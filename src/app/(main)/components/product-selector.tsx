'use client';

import React, { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

type Product = {
  productName: string;
  unitPrice?: number;
};

type ProductSelectorProps<T extends { items: any[] }> = {
  form: UseFormReturn<T>;
  index: number;
};

export function ProductSelector<T extends { items: any[] }>({ form, index }: ProductSelectorProps<T>) {
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const productsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'products') : null),
    [firestore]
  );
  const { data: products } = useCollection<Product>(productsQuery);

  const productOptions = React.useMemo(() => {
    const options = products?.map((p) => ({
      value: p.productName,
      label: p.productName,
      unitPrice: p.unitPrice,
    })) || [];
    
    const currentValue = form.getValues(`items.${index}.product`);
    if (currentValue && !options.some(o => o.value.toLowerCase() === currentValue.toLowerCase())) {
        options.unshift({ value: currentValue, label: `زیادکردنی "${currentValue}"`, unitPrice: 0});
    }

    return options;
  }, [products, form, index]);


  return (
    <FormField
      control={form.control}
      name={`items.${index}.product`}
      render={({ field }) => (
        <FormItem>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal"
                >
                  {field.value
                    ? productOptions.find(
                        (p) => p.value.toLowerCase() === field.value.toLowerCase()
                      )?.label
                    : 'کاڵایەک هەڵبژێرە...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command
                filter={(value, search) => {
                  if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                  return 0;
                }}
              >
                <CommandInput placeholder="گەڕان بۆ کاڵا..." />
                <CommandList>
                  <CommandEmpty>هیچ کاڵایەک نەدۆزرایەوە.</CommandEmpty>
                  <CommandGroup>
                    {productOptions.map((product) => (
                      <CommandItem
                        value={product.value}
                        key={product.value}
                        onSelect={(currentValue) => {
                          const selectedValue = currentValue.toLowerCase() === field.value?.toLowerCase() ? '' : product.value;
                          form.setValue(`items.${index}.product`, selectedValue);
                          
                          const selectedProduct = products?.find(p => p.productName.toLowerCase() === selectedValue.toLowerCase());
                          if (selectedProduct && selectedProduct.unitPrice) {
                              form.setValue(`items.${index}.unitPrice`, selectedProduct.unitPrice, { shouldValidate: true });
                          }

                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            field.value?.toLowerCase() === product.value.toLowerCase()
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {product.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
