'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
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
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

type Product = {
  productName: string;
  unitPrice?: number;
};

// This defines the shape of the form data that the ProductSelector can work with.
// It expects the form to have an 'items' array.
type FormWithItems = {
  items: {
    product: string;
    unitPrice?: number;
    [key: string]: any;
  }[];
};

type ProductSelectorProps<T extends FormWithItems> = {
  form: UseFormReturn<T>;
  index: number;
};

export function ProductSelector<T extends FormWithItems>({ form, index }: ProductSelectorProps<T>) {
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);

  const productsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'products') : null),
    [firestore]
  );
  const { data: products } = useCollection<Product>(productsQuery);

  const productOptions = React.useMemo(() => {
    return products?.map((p) => ({
      value: p.productName.toLowerCase(),
      label: p.productName,
      unitPrice: p.unitPrice,
    })) || [];
  }, [products]);
  
  const currentValue = form.watch(`items.${index}.product`);

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
                  {field.value || "کاڵایەک هەڵبژێرە..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command
                filter={(value, search) => {
                    const option = productOptions.find(o => o.value === value);
                    if (option?.label.toLowerCase().includes(search.toLowerCase())) return 1;
                    return 0;
                }}
              >
                <CommandInput placeholder="گەڕان بۆ کاڵا..." />
                <CommandList>
                  <CommandEmpty>
                    <div className='p-4 text-sm'>
                        هیچ کاڵایەک نەدۆزرایەوە.
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {productOptions.map((product) => (
                      <CommandItem
                        value={product.value}
                        key={product.value}
                        onSelect={(selectedValue) => {
                          const selectedOption = productOptions.find(p => p.value === selectedValue);
                          if (selectedOption) {
                            form.setValue(`items.${index}.product`, selectedOption.label, { shouldValidate: true });
                            if (selectedOption.unitPrice) {
                                form.setValue(`items.${index}.unitPrice`, selectedOption.unitPrice, { shouldValidate: true });
                            } else {
                                form.setValue(`items.${index}.unitPrice`, 0, { shouldValidate: true });
                            }
                          } else {
                             form.setValue(`items.${index}.product`, selectedValue, { shouldValidate: true });
                             form.setValue(`items.${index}.unitPrice`, 0, { shouldValidate: true });
                          }
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            currentValue?.toLowerCase() === product.label.toLowerCase()
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
