
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddCustomerForm } from '../customers/components/add-customer-form';

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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<WithId<Customer> | null>(null);

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

  async function handleDelete(customerId: string) {
    if (!firestore) return;

    try {
        await deleteDoc(doc(firestore, "customers", customerId));
        toast({
            title: "سەرکەوتوو بوو!",
            description: "کڕیارەکە بە سەرکەوتوویی سڕایەوە.",
            className: "bg-accent text-accent-foreground",
        });
    } catch (error) {
        console.error("Error deleting customer:", error);
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: "سڕینەوەی کڕیار سەرکەوتوو نەبوو.",
        });
    }
  }

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
      <ScrollArea className="h-[60vh] md:h-[450px]" dir="rtl">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">ناوی کڕیار</TableHead>
                <TableHead className="text-right">ژمارەی تەلەفۆن</TableHead>
                <TableHead className="text-right">ناونیشان</TableHead>
                <TableHead className="text-center">کردارەکان</TableHead>
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
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    هیچ کڕیارێک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="text-right font-medium">{customer.customerName}</TableCell>
                    <TableCell className="text-right">{customer.customerPhoneNumber || 'نەزانراو'}</TableCell>
                    <TableCell className="text-right">{customer.customerAddress || 'نەزانراو'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                              <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم کڕیارە؟</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          ئەم کردارە پاشگەزبوونەوەی نییە و هەموو زانیارییەکانی ئەم کڕیارە دەسڕێتەوە.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>پاشگەزبوونەوە</AlertDialogCancel>
                                      <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }} className="bg-destructive hover:bg-destructive/90">بەڵێ، بسڕەوە</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </TableCell>
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
        </div>

        {/* Mobile View */}
        <div className="space-y-4 md:hidden py-2 px-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              هیچ کڕیارێک نەدۆزرایەوە.
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-card border rounded-lg p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-base text-right">{customer.customerName}</div>
                    <div className="text-sm text-muted-foreground mt-1 text-right">
                      {customer.customerPhoneNumber || 'نەزانراو'}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSelect(customer)}>
                    هەڵبژاردن
                  </Button>
                </div>
                
                {customer.customerAddress && (
                  <div className="text-sm text-right mt-1">
                    <span className="text-muted-foreground ml-1">ناونیشان:</span>
                    {customer.customerAddress}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-3 border-t mt-1">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                    <Edit className="h-4 w-4 ml-1 text-blue-500" /> دەستکاری
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 ml-1" /> سڕینەوە
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                       <AlertDialogHeader>
                           <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم کڕیارە؟</AlertDialogTitle>
                           <AlertDialogDescription>
                               ئەم کردارە پاشگەزبوونەوەی نییە و هەموو زانیارییەکانی ئەم کڕیارە دەسڕێتەوە.
                           </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                           <AlertDialogCancel onClick={(e) => e.stopPropagation()}>پاشگەزبوونەوە</AlertDialogCancel>
                           <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }} className="bg-destructive hover:bg-destructive/90">بەڵێ، بسڕەوە</AlertDialogAction>
                       </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
                <DialogTitle>دەستکاریکردنی زانیارییەکانی کڕیار</DialogTitle>
                <DialogDescription>
                    زانیارییەکان بگۆڕە و پاشەکەوتی بکە.
                </DialogDescription>
            </DialogHeader>
            {editingCustomer && (
                <AddCustomerForm 
                    customerId={editingCustomer.id}
                    initialData={{
                        customerName: editingCustomer.customerName,
                        customerPhoneNumber: editingCustomer.customerPhoneNumber || "",
                        customerAddress: editingCustomer.customerAddress || "",
                    }}
                    onCustomerAdded={() => setEditingCustomer(null)} 
                />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    