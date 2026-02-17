"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirestore, doc, runTransaction, getDoc, collection, getDocs, DocumentReference, useMemoFirebase, useCollection } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductSelectorDialog } from "../../components/product-selector-dialog";
import { CustomerSelectorDialog } from "../../components/customer-selector-dialog";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { WithId } from "@/firebase/firestore/use-collection";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Customer = {
  customerName: string;
  customerPhoneNumber?: string;
  customerAddress?: string;
};


const salesFormSchema = z.object({
  formNumber: z.string().min(1, "ژمارەی فۆڕم پێویستە."),
  customerName: z.string().min(1, { message: "نووسینی ناوی کڕیار پێویستە." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  issueDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی بەروار هەڵەیە (YYYY-MM-DD)." }),
  items: z.array(z.object({
    product: z.string().min(1, "بابەت پێویستە."),
    quantity: z.coerce.number().min(1, "دانە دەبێت لانیکەم 1 بێت."),
    unitPrice: z.coerce.number().min(0, "نرخ پێویستە."),
    category: z.string().min(1, "پۆل پێویستە."),
  })).min(1, { message: "لانیکەم یەک کاڵا پێویستە." }),
  deliveryCost: z.coerce.number().optional().default(0),
  discountType: z.enum(["percentage", "cash"]).optional(),
  discountValue: z.coerce.number().optional().default(0),
  paymentStatus: z.enum(["Unpaid", "Partially Paid", "Fully Paid"]),
  paymentType: z.enum(["After Delivery", "Installments", "Pre-order", "Direct Payment"]),
  payments: z.array(z.object({
      date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی بەروار هەڵەیە (YYYY-MM-DD)." }),
      amount: z.coerce.number().min(0.01, "بڕ دەبێت موجەب بێت."),
      method: z.enum(["Cash", "Transfer"]),
      note: z.string().optional(),
  })).optional(),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

type SalesFormProps = {
    formId?: string | null;
    onSave?: () => void;
};


function SalesFormItemRow({
    form,
    index,
    remove,
    fieldId
}: {
    form: UseFormReturn<SalesFormValues>;
    index: number;
    remove: (index: number) => void;
    fieldId: string;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const watchedItem = form.watch(`items.${index}`);
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    
    return (
        <TableRow key={fieldId}>
            <TableCell className="align-top">
                <FormField
                  control={form.control}
                  name={`items.${index}.product`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                            <Input placeholder="ناوی کاڵا..." {...field} />
                        </FormControl>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon"><List className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent dir="rtl" className="sm:max-w-3xl">
                              <DialogHeader>
                                  <DialogTitle>لیستی کاڵاکان</DialogTitle>
                              </DialogHeader>
                              <ProductSelectorDialog onProductSelect={({name, price, category}) => {
                                  form.setValue(`items.${index}.product`, name);
                                  form.setValue(`items.${index}.unitPrice`, price);
                                  form.setValue(`items.${index}.category`, category);
                                  setDialogOpen(false);
                              }} />
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </TableCell>
            <TableCell className="align-top">
                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </TableCell>
            <TableCell className="align-top">
                <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (<FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </TableCell>
             <TableCell className="align-top pt-5 font-semibold text-left">
                {currencyFormatter.format(watchedItem?.quantity * watchedItem?.unitPrice || 0)}
            </TableCell>
            <TableCell className="align-top">
                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

export function SalesForm({ formId, onSave }: SalesFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      formNumber: "0",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      items: [{ product: "", quantity: 1, unitPrice: 0, category: 'Mattress' }],
      deliveryCost: 0,
      discountValue: 0,
      paymentStatus: "Fully Paid",
      paymentType: "Direct Payment",
      payments: [],
    },
  });

  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const customerNameValue = form.watch('customerName');
  const debouncedCustomerName = useDebounce(customerNameValue, 300);

  useEffect(() => {
      if (debouncedCustomerName && customers) {
          const foundCustomer = customers.find(c => c.customerName.toLowerCase() === debouncedCustomerName.toLowerCase());
          if (foundCustomer) {
              form.setValue('customerPhone', foundCustomer.customerPhoneNumber || '');
              form.setValue('customerAddress', foundCustomer.customerAddress || '');
          }
      }
  }, [debouncedCustomerName, customers, form]);

  const paymentType = form.watch('paymentType');
  const discountType = form.watch('discountType');
  const watchedItems = form.watch('items');
  const deliveryCost = form.watch('deliveryCost');
  const watchedPayments = form.watch('payments');
  const discountValue = form.watch('discountValue');

  const subTotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const discountAmount = React.useMemo(() => {
    if (!discountType || !discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return (subTotal * discountValue) / 100;
    }
    return discountValue;
  }, [subTotal, discountType, discountValue]);

  const totalAfterDiscount = subTotal - discountAmount;
  const totalAmount = totalAfterDiscount + Number(deliveryCost || 0);
  const totalPaid = watchedPayments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
  
  const remainingBalance = Math.max(0, totalAmount - totalPaid);
  const overpayment = Math.max(0, totalPaid - totalAmount);

   useEffect(() => {
        if (!discountType) {
            form.setValue('discountValue', 0);
        }
    }, [discountType, form]);

    useEffect(() => {
        if (paymentType === 'Direct Payment' || paymentType === 'Pre-order') {
            form.setValue('paymentStatus', 'Fully Paid');
        } else if (paymentType === 'After Delivery') {
            form.setValue('paymentStatus', 'Unpaid');
        } else if (paymentType === 'Installments') {
            if (totalPaid === 0) {
                form.setValue('paymentStatus', 'Unpaid');
            } else if (totalPaid >= totalAmount) {
                form.setValue('paymentStatus', 'Fully Paid');
            } else {
                form.setValue('paymentStatus', 'Partially Paid');
            }
        }
    }, [paymentType, form, totalPaid, totalAmount]);


  useEffect(() => {
    async function fetchFormData() {
      if (formId && firestore) {
        setIsLoading(true);
        try {
          const formRef = doc(firestore, 'selling_forms', formId);
          const formSnap = await getDoc(formRef);

          if (formSnap.exists()) {
            const data = formSnap.data();
            
            const itemsRef = collection(firestore, `selling_forms/${formId}/selling_form_products`);
            const itemsSnap = await getDocs(itemsRef);
            const items = itemsSnap.docs.map(d => ({...d.data()}));
            
            const paymentsRef = collection(firestore, `selling_forms/${formId}/payments`);
            const paymentsSnap = await getDocs(paymentsRef);
            const payments = paymentsSnap.docs.map(d => ({
                ...d.data(),
                date: d.data().paymentDate,
            }));

            setOriginalItems(items); // Store original items for stock calculation

            form.reset({
              ...data,
              issueDate: data.issueDate,
              items: items.map(item => ({
                  product: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  category: item.category,
              })),
              payments: payments as any,
            });

          }
        } catch (error) {
          console.error("Error fetching form data:", error);
          toast({ variant: 'destructive', title: "Error fetching data" });
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchFormData();
  }, [formId, firestore, form, toast]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: "payments",
  });
  
  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  
  async function onSubmit(data: SalesFormValues) {
    if (!firestore) {
      toast({ variant: "destructive", title: "هەڵەیەک ڕوویدا", description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە." });
      return;
    }
    
    const sellingFormRef = formId ? doc(firestore, "selling_forms", formId) : doc(collection(firestore, "selling_forms"));
    const sellingFormId = sellingFormRef.id;

    const productRefsToDelete: DocumentReference[] = [];
    const paymentRefsToDelete: DocumentReference[] = [];

    if (formId) {
        try {
            const existingProductsSnap = await getDocs(collection(firestore, `selling_forms/${formId}/selling_form_products`));
            existingProductsSnap.forEach(doc => productRefsToDelete.push(doc.ref));

            const existingPaymentsSnap = await getDocs(collection(firestore, `selling_forms/${formId}/payments`));
            existingPaymentsSnap.forEach(doc => paymentRefsToDelete.push(doc.ref));
        } catch (error) {
            console.error("Error fetching old items for deletion:", error);
            toast({ variant: 'destructive', title: 'هەڵە لە خوێندنەوەی داتای کۆن', description: "نەتوانرا داتای پێشوو بسڕدرێتەوە." });
            return;
        }
    }
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const productRefsToRead = new Map<string, DocumentReference>();

        if (formId) {
          originalItems.forEach((item) => {
            if (item.productId) productRefsToRead.set(item.productId, doc(firestore, 'products', item.productId));
          });
        }
        
        data.items.forEach(item => {
          const showroomId = `${item.product.toLowerCase().replace(/[^a-z0-9]/g, '-')}-shopshowroom`;
          const warehouseId = `${item.product.toLowerCase().replace(/[^a-z0-9]/g, '-')}-warehouse`;
          productRefsToRead.set(showroomId, doc(firestore, 'products', showroomId));
          productRefsToRead.set(warehouseId, doc(firestore, 'products', warehouseId));
        });

        const productSnaps = await Promise.all(
          Array.from(productRefsToRead.values()).map(ref => transaction.get(ref))
        );
        const productDocs = new Map(productSnaps.map(snap => [snap.id, snap]));

        const stockChanges = new Map<string, { change: number, resolvedId: string | null }>();

        if (formId) {
          originalItems.forEach(item => {
            if (item.productId) {
              stockChanges.set(item.productId, { change: item.quantity, resolvedId: item.productId });
            }
          });
        }

        for (const item of data.items) {
          const showroomId = `${item.product.toLowerCase().replace(/[^a-z0-9]/g, '-')}-shopshowroom`;
          const warehouseId = `${item.product.toLowerCase().replace(/[^a-z0-9]/g, '-')}-warehouse`;
          
          const showroomDoc = productDocs.get(showroomId);
          const warehouseDoc = productDocs.get(warehouseId);

          const showroomCurrentStock = showroomDoc?.exists() ? showroomDoc.data().currentQuantity : 0;
          const warehouseCurrentStock = warehouseDoc?.exists() ? warehouseDoc.data().currentQuantity : 0;
          
          const showroomStockAfterRestore = showroomCurrentStock + (stockChanges.get(showroomId)?.change || 0);
          const warehouseStockAfterRestore = warehouseCurrentStock + (stockChanges.get(warehouseId)?.change || 0);
          
          let deductedFrom: string | null = null;
          if (showroomStockAfterRestore >= item.quantity) {
            deductedFrom = showroomId;
          } else if (warehouseStockAfterRestore >= item.quantity) {
            deductedFrom = warehouseId;
          }

          if (!deductedFrom) {
            throw new Error(`بڕی بەشی ناکات بۆ کاڵای: "${item.product}"`);
          }
          
          const currentChange = stockChanges.get(deductedFrom)?.change || 0;
          stockChanges.set(deductedFrom, { change: currentChange - item.quantity, resolvedId: deductedFrom });
          (item as any).resolvedProductId = deductedFrom;
        }

        for (const [productId, { change }] of stockChanges.entries()) {
          const productRef = productRefsToRead.get(productId)!;
          const productDoc = productDocs.get(productId);

          if (productDoc?.exists()) {
            const currentQuantity = productDoc.data()!.currentQuantity;
            transaction.update(productRef, { currentQuantity: currentQuantity + change });
          }
        }
        
        const { items, payments, ...mainData } = data;
        const finalRemainingBalance = Math.max(0, totalAmount - (payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0));
        
        const sellingFormData: any = { ...mainData, id: sellingFormId, creatorId: "system", issueDate: data.issueDate, totalPrice: totalAmount, remainingBalance: finalRemainingBalance };
        if (!sellingFormData.discountValue) sellingFormData.discountValue = 0;
        if (!sellingFormData.discountType) delete sellingFormData.discountType;
        transaction.set(sellingFormRef, sellingFormData, { merge: true });

        productRefsToDelete.forEach(ref => transaction.delete(ref));
        paymentRefsToDelete.forEach(ref => transaction.delete(ref));

        items.forEach(item => {
          const productSubCollectionRef = doc(collection(firestore, `selling_forms/${sellingFormId}/selling_form_products`));
          transaction.set(productSubCollectionRef, {
            id: productSubCollectionRef.id,
            sellingFormId: sellingFormId,
            productId: (item as any).resolvedProductId,
            productName: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice,
            category: item.category,
          });
        });

        if (data.paymentType === 'Installments' && payments) {
          payments.forEach(payment => {
            const paymentRef = doc(collection(firestore, `selling_forms/${sellingFormId}/payments`));
            transaction.set(paymentRef, {
              ...payment,
              id: paymentRef.id,
              paymentDate: payment.date,
              sellingFormId: sellingFormId,
            });
          });
        }
      });

      toast({ title: "سەرکەوتوو بوو!", description: `فۆڕمی فرۆشتن بە سەرکەوتوویی ${formId ? 'نوێکرایەوە' : 'پاشەکەوت کرا'}.`, className: "bg-accent text-accent-foreground", });
      if (onSave) onSave();
      if (!formId) form.reset();

    } catch (error: any) {
      console.error("Error saving sales form:", error);
      toast({ variant: "destructive", title: "هەڵەیەک ڕوویدا", description: error.message || "پاشەکەوتکردنی فۆڕمی فرۆشتن سەرکەوتوو نەبوو.", });
    }
  }


  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
        <Card>
            <CardHeader className="flex flex-row justify-between items-start p-4">
                 <FormField
                    control={form.control}
                    name="formNumber"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                        <FormLabel className="font-bold text-lg mt-2">No.</FormLabel>
                        <FormControl><Input className="w-24 font-bold text-lg" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                            <FormLabel className="mt-2">بەروار:</FormLabel>
                            <FormControl>
                                <Input placeholder="YYYY-MM-DD" {...field} className="w-[180px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardHeader>
        </Card>

        <Card>
            <CardHeader><CardTitle>زانیاری کڕیار</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-start gap-4">
                    <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>بەڕێز</FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon"><List className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent dir="rtl" className="sm:max-w-3xl">
                                        <DialogHeader>
                                            <DialogTitle>لیستی کڕیارەکان</DialogTitle>
                                        </DialogHeader>
                                        <CustomerSelectorDialog onCustomerSelect={(customer) => {
                                            form.setValue('customerName', customer.customerName);
                                            form.setValue('customerPhone', customer.customerPhoneNumber);
                                            form.setValue('customerAddress', customer.customerAddress);
                                            setIsCustomerDialogOpen(false);
                                        }} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => ( <FormItem className="flex-1"> <FormLabel>ژ. مۆبایل</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </div>
                <FormField control={form.control} name="customerAddress" render={({ field }) => ( <FormItem> <FormLabel>ناونیشان</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>کاڵا فرۆشراوەکان</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%] text-right">بابەت</TableHead>
                            <TableHead className="text-center">دانە</TableHead>
                            <TableHead className="text-center">نرخی تاک</TableHead>
                            <TableHead className="text-left">نرخی کۆ</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <SalesFormItemRow
                                key={field.id}
                                fieldId={field.id}
                                form={form}
                                index={index}
                                remove={() => fields.length > 1 && remove(index)}
                            />
                        ))}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ product: "", quantity: 1, unitPrice: 0, category: 'Mattress' })}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    زیادکردنی کاڵا
                </Button>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>دارایی</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <FormLabel>داشکاندن</FormLabel>
                        <div className="flex gap-4 items-center">
                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex items-center space-x-2 space-x-reverse"
                                        dir="rtl"
                                        >
                                        <FormItem className="flex items-center space-x-1 space-x-reverse">
                                            <FormControl><RadioGroupItem value="percentage" /></FormControl>
                                            <FormLabel className="font-normal">%</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-1 space-x-reverse">
                                            <FormControl><RadioGroupItem value="cash" /></FormControl>
                                            <FormLabel className="font-normal">بڕی دیاریکراو</FormLabel>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discountValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} disabled={!discountType} className="w-32" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                     <FormField
                        control={form.control}
                        name="deliveryCost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>تێچووی گەیاندن</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} className="w-32" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>جۆری پارەدان</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Direct Payment">پارەی ڕاستەوخۆ</SelectItem>
                                <SelectItem value="After Delivery">دوای گەیاندن</SelectItem>
                                <SelectItem value="Installments">قیست</SelectItem>
                                <SelectItem value="Pre-order">داواکاری پێشوەختە</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                        <FormField
                            control={form.control}
                            name="paymentStatus"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>دۆخی پارەدان</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={paymentType !== 'Installments'}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Fully Paid">هەمووی دراوە</SelectItem>
                                    <SelectItem value="Partially Paid">بەشێکی دراوە</SelectItem>
                                    <SelectItem value="Unpaid">نەدراوە</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>پوختە</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-left">
                    <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                        <span className="text-muted-foreground">کۆی کاڵاکان:</span>
                        <span className="font-semibold">{currencyFormatter.format(subTotal)}</span>
                    </div>
                     <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                        <span className="text-muted-foreground">داشکاندن:</span>
                        <span className="font-semibold text-destructive">-{currencyFormatter.format(discountAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                        <span className="text-muted-foreground">تێچووی گەیاندن:</span>
                        <span className="font-semibold">{currencyFormatter.format(Number(deliveryCost) || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary/80 text-lg">
                        <span className="font-bold">کۆی گشتی:</span>
                        <span className="font-bold">{currencyFormatter.format(totalAmount)}</span>
                    </div>
                    {paymentType === 'Installments' && (
                        <>
                            <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                                <span className="text-muted-foreground">کۆی دراوە:</span>
                                <span className="font-semibold text-green-500">{currencyFormatter.format(totalPaid)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-destructive/10 text-destructive text-lg">
                                <span className="font-bold">ماوە:</span>
                                <span className="font-bold">{currencyFormatter.format(remainingBalance)}</span>
                            </div>
                             {overpayment > 0 && (
                                <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-green-500/10 text-green-500 text-lg">
                                    <span className="font-bold">بڕی زیادە:</span>
                                    <span className="font-bold">{currencyFormatter.format(overpayment)}</span>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
        
        {paymentType === 'Installments' && (
             <Card>
                <CardHeader><CardTitle>تۆماری قیستەکان</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-1/4 text-center">بەروار</TableHead><TableHead className="text-center">بڕ</TableHead><TableHead className="text-center">شێواز</TableHead><TableHead className="text-center">تێبینی</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {paymentFields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell><FormField control={form.control} name={`payments.${index}.date`} render={({ field }) => ( <FormItem><FormControl><Input placeholder="YYYY-MM-DD" {...field} /></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                <TableCell><FormField control={form.control} name={`payments.${index}.amount`} render={({ field }) => ( <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                <TableCell>
                                    <FormField
                                    control={form.control}
                                    name={`payments.${index}.method`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <FormControl>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                <SelectItem value="Cash">کاش</SelectItem>
                                                <SelectItem value="Transfer">حەواڵە</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        <FormMessage/>
                                        </FormItem>
                                    )}
                                    />
                                </TableCell>
                                <TableCell><FormField control={form.control} name={`payments.${index}.note`} render={({ field }) => ( <FormItem><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)}/></TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => removePayment(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendPayment({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, method: 'Cash', note:'' })}>
                        <PlusCircle className="ml-2 h-4 w-4" /> زیادکردنی قیست
                    </Button>
                </CardContent>
             </Card>
        )}

        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "...پاشەکەوت دەکرێت" : (formId ? "نوێکردنەوەی فۆڕم" : "پاشەکەوتکردنی فۆڕم")}
            </Button>
        </div>
      </form>
    </Form>
  );
}
