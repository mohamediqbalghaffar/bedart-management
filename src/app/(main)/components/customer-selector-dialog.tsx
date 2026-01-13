'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type Customer = {
  customerName: string;
  customerPhoneNumber?: string;
  customerAddress?: string;
};

type CustomerSelectorDialogProps = {
  onCustomerSelect: (customer: Customer) => void;
};

export function CustomerSelectorDialog({ onCustomerSelect }: CustomerSelectorDialogProps) {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);

  const { data: customers, isLoading } = useCollection<Customer>(customersQuery);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!searchTerm) return customers;
    return customers.filter(c => 
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerPhoneNumber?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleSelect = (customer: WithId<Customer>) => {
    onCustomerSelect({
      customerName: customer.customerName,
      customerPhoneNumber: customer.customerPhoneNumber,
      customerAddress: customer.customerAddress,
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative" dir="rtl">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="...گەڕان بەپێی ناو یان ژمارەی تەلەفۆن"
          className="pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="h-[450px]" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">ناوی کڕیار</TableHead>
              <TableHead className="text-right">ژمارەی تەلەفۆن</TableHead>
              <TableHead className="text-right">ناونیشان</TableHead>
              <TableHead className="text-left"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  هیچ کڕیارێک نەدۆزرایەوە.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell className="text-right font-medium">{customer.customerName}</TableCell>
                  <TableCell className="text-right">{customer.customerPhoneNumber || 'N/A'}</TableCell>
                  <TableCell className="text-right">{customer.customerAddress || 'N/A'}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="sm" onClick={() => handleSelect(customer)}>
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
