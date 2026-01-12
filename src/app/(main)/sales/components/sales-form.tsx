
"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2, List } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirestore, setDocumentNonBlocking, doc, runTransaction, getDoc, collection, getDocs, deleteDoc } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductSelectorDialog } from "../../components/product-selector-dialog";
import { Loader2 } from "lucide-react";


const salesFormSchema = z.object({
  formNumber: z.string().min(1, "ژمارەی فۆڕم پێویستە."),
  customerName: z.string().min(1, { message: "ناوی کڕیار پێویستە." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  issueDate: z.date({ required_error: "بەرواری دەرکردن پێویستە." }),
  items: z.array(z.object({
    product: z.string().min(1, "بابەت پێویستە."),
    quantity: z.coerce.number().min(1, "دانە دەبێت لانیکەم 1 بێت."),
    unitPrice: z.coerce.number().min(0, "نرخ پێویستە."),
  })).min(1, { message: "لانیکەم یەک کاڵا پێویستە." }),
  deliveryCost: z.coerce.number().optional().default(0),
  discountType: z.enum(["percentage", "cash"]).optional(),
  discountValue: z.coerce.number().optional().default(0),
  paymentStatus: z.enum(["Unpaid", "Partially Paid", "Fully Paid"]),
  paymentType: z.enum(["After Delivery", "Installments", "Pre-order"]),
  payments: z.array(z.object({
      date: z.date({ required_error: "بەرواری پارەدان پێویستە." }),
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
                          <DialogContent dir="rtl">
                              <DialogHeader>
                                  <DialogTitle>لیستی کاڵاکان</DialogTitle>
                              </DialogHeader>
                              <ProductSelectorDialog onProductSelect={({name, price}) => {
                                  form.setValue(`items.${index}.product`, name);
                                  form.setValue(`items.${index}.unitPrice`, price);
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
             <TableCell className="align-top pt-5 font-semibold">
                {new Intl.NumberFormat('en-US').format(watchedItem?.quantity * watchedItem?.unitPrice || 0)}
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
  const [isIssueDateOpen, setIssueDateOpen] = useState(false);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      formNumber: "0",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      issueDate: new Date(),
      items: [{ product: "", quantity: 1, unitPrice: 0 }],
      deliveryCost: 0,
      discountValue: 0,
      paymentStatus: "Unpaid",
      paymentType: "After Delivery",
      payments: [],
    },
  });

  useEffect(() => {
    async function fetchFormData() {
      if (formId && firestore) {
        setIsLoading(true);
        try {
          const formRef = doc(firestore, 'selling_forms', formId);
          const formSnap = await getDoc(formRef);

          if (formSnap.exists()) {
            const data = formSnap.data();
            
            const itemsRef = collection(firestore, `selling_forms/${formId}/products`);
            const itemsSnap = await getDocs(itemsRef);
            const items = itemsSnap.docs.map(d => ({...d.data()}));
            
            const paymentsRef = collection(firestore, `selling_forms/${formId}/payments`);
            const paymentsSnap = await getDocs(paymentsRef);
            const payments = paymentsSnap.docs.map(d => ({
                ...d.data(),
                date: parseISO(d.data().paymentDate), // parse string back to Date
            }));

            setOriginalItems(items); // Store original items for stock calculation

            form.reset({
              ...data,
              issueDate: data.issueDate ? parseISO(data.issueDate) : new Date(),
              items: items.map(item => ({
                  product: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
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

  const watchedItems = form.watch('items');
  const deliveryCost = form.watch('deliveryCost');
  const watchedPayments = form.watch('payments');
  const discountType = form.watch('discountType');
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
  const totalAmount = totalAfterDiscount + (deliveryCost || 0);
  const totalPaid = watchedPayments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const remainingBalance = totalAmount - totalPaid;

  useEffect(() => {
    if (totalAmount > 0) {
      if (totalPaid <= 0) {
          form.setValue("paymentStatus", "Unpaid");
      } else if (remainingBalance <= 0) {
          form.setValue("paymentStatus", "Fully Paid");
      } else {
          form.setValue("paymentStatus", "Partially Paid");
      }
    } else {
       form.setValue("paymentStatus", "Unpaid");
    }
  }, [totalPaid, totalAmount, remainingBalance, form]);


  async function onSubmit(data: SalesFormValues) {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
        });
        return;
    }
    
    try {
        const itemChanges = new Map<string, number>();

        // STOCK VALIDATION
        for (const item of data.items) {
            const docId = item.product.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const productRef = doc(firestore, 'products', docId);
            const productDoc = await getDoc(productRef);

            if (!productDoc.exists()) {
                toast({ variant: "destructive", title: "کاڵا نەدۆزرایەوە", description: `کاڵای "${item.product}" لە کۆگا نەدۆزرایەوە.` });
                return;
            }

            const currentQuantity = productDoc.data().currentQuantity || 0;
            const originalQuantity = originalItems.find(orig => orig.productName === item.product)?.quantity || 0;
            const requestedChange = item.quantity - originalQuantity;

            if (requestedChange > 0 && currentQuantity < requestedChange) {
                toast({ variant: "destructive", title: "بڕی کاڵا بەشی ناکات", description: `تەنها ${currentQuantity} دانە لە "${item.product}" لە کۆگا ماوە.` });
                return;
            }

            itemChanges.set(docId, (itemChanges.get(docId) || 0) - (item.quantity - originalQuantity));
        }


        // Apply stock changes via transaction
        for (const [docId, qtyChange] of itemChanges.entries()) {
            if(qtyChange === 0) continue;
            
            const productRef = doc(firestore, 'products', docId);
             await runTransaction(firestore, async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw new Error(`Product "${docId}" not found.`);
                }
                const currentQuantity = productDoc.data().currentQuantity || 0;
                const newQuantity = currentQuantity + qtyChange;
                transaction.update(productRef, { currentQuantity: newQuantity });
            });
        }


        const sellingFormRef = formId ? doc(firestore, "selling_forms", formId) : doc(collection(firestore, "selling_forms"));
        const sellingFormId = sellingFormRef.id;

        const { items, payments, ...mainData } = data;

        const sellingFormData = {
            ...mainData,
            id: sellingFormId,
            creatorId: "system",
            issueDate: format(data.issueDate, "yyyy-MM-dd"),
            totalPrice: totalAmount,
            remainingBalance: remainingBalance,
        };
        
        await setDocumentNonBlocking(sellingFormRef, sellingFormData, { merge: true });
        
        if (formId) {
            const existingItems = await getDocs(collection(firestore, `selling_forms/${formId}/products`));
            await Promise.all(existingItems.docs.map(d => deleteDoc(d.ref)));
            const existingPayments = await getDocs(collection(firestore, `selling_forms/${formId}/payments`));
            await Promise.all(existingPayments.docs.map(p => deleteDoc(p.ref)));
        }


        const itemPromises = items.map(item => {
            const productSubCollectionRef = doc(collection(firestore, `selling_forms/${sellingFormId}/products`));
            const productDocId = item.product.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const productData = {
                id: productSubCollectionRef.id,
                sellingFormId: sellingFormId,
                productId: productDocId,
                productName: item.product,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.quantity * item.unitPrice,
            };
            return setDocumentNonBlocking(productSubCollectionRef, productData, { merge: true });
        });

        const paymentPromises = (payments || []).map(payment => {
            const paymentRef = doc(collection(firestore, `selling_forms/${sellingFormId}/payments`));
            const paymentData = {
                ...payment,
                id: paymentRef.id,
                paymentDate: format(payment.date, "yyyy-MM-dd"),
                sellingFormId: sellingFormId,
            };
            return setDocumentNonBlocking(paymentRef, paymentData, { merge: true });
        });

        await Promise.all([...itemPromises, ...paymentPromises]);

        toast({
            title: "سەرکەوتوو بوو!",
            description: `فۆڕمی فرۆشتن بە سەرکەوتوویی ${formId ? 'نوێکرایەوە' : 'پاشەکەوت کرا'}.`,
            className: "bg-accent text-accent-foreground",
        });
        
        if (onSave) onSave();
        if(!formId) form.reset();


    } catch (error: any) {
        console.error("Error saving sales form:", error);
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: error.message || "پاشەکەوتکردنی فۆڕمی فرۆشتن سەرکەوتوو نەبوو.",
        });
    }
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
        <div className="flex justify-between items-start p-1">
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
                        <Popover open={isIssueDateOpen} onOpenChange={setIssueDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[180px] justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {field.value ? (
                                    format(field.value, "PPP", { locale: arSA })
                                    ) : (
                                    <span>بەروارێک</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start" dir="ltr">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                        if (date) {
                                            field.onChange(date);
                                            setIssueDateOpen(false);
                                        }
                                    }}
                                    initialFocus
                                    locale={arSA}
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="space-y-2 p-1 border-t pt-4">
          <div className="flex items-center gap-4">
            <FormField control={form.control} name="customerName" render={({ field }) => ( <FormItem className="flex-1 flex items-center gap-2"> <FormLabel>بەڕێز:</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="customerPhone" render={({ field }) => ( <FormItem className="flex-1 flex items-center gap-2"> <FormLabel>ژ. مۆبایل:</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
          <FormField control={form.control} name="customerAddress" render={({ field }) => ( <FormItem className="flex items-center gap-2"> <FormLabel>ناونیشان:</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
        </div>
        
        <div className="relative border-t pt-6">
            <Table>
                <TableHeader>
                    <TableRow className="bg-primary/90 hover:bg-primary">
                        <TableHead className="w-2/5 text-primary-foreground text-center">بابەت</TableHead>
                        <TableHead className="text-primary-foreground text-center">دانە</TableHead>
                        <TableHead className="text-primary-foreground text-center">نرخی تاک</TableHead>
                        <TableHead className="text-primary-foreground text-center">نرخی کۆ</TableHead>
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
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ product: "", quantity: 1, unitPrice: 0 })}>
                <PlusCircle className="ml-2 h-4 w-4" />
                زیادکردنی کاڵا
            </Button>
        </div>

        <div className="flex justify-between items-start gap-8 pt-6 border-t">
            <div className="space-y-4 flex-1">
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
                                    defaultValue={field.value}
                                    className="flex items-center space-x-2 space-x-reverse"
                                    dir="rtl"
                                    >
                                    <FormItem className="flex items-center space-x-1 space-x-reverse">
                                        <FormControl>
                                            <RadioGroupItem value="percentage" />
                                        </FormControl>
                                        <FormLabel className="font-normal">%</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-1 space-x-reverse">
                                        <FormControl>
                                            <RadioGroupItem value="cash" />
                                        </FormControl>
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>جۆری پارەدان</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="جۆرێک هەڵبژێرە" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="After Delivery">دوای گەیاندن</SelectItem>
                            <SelectItem value="Installments">قیست</SelectItem>
                            <SelectItem value="Pre-order">داواکاری پێشوەختە</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="paymentStatus" render={({ field }) => ( <FormItem> <FormLabel>دۆخی پارەدان</FormLabel> <FormControl><Input {...field} readOnly className="font-semibold bg-secondary/70 border-none" /></FormControl> <FormMessage /> </FormItem> )} />
                </div>
                <div className="space-y-2">
                    <FormLabel>واژۆ</FormLabel>
                    <div className="w-48 h-16 border-b-2 border-dashed"></div>
                </div>
            </div>
            <div className="space-y-2 text-left min-w-[280px]">
                <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <span className="text-muted-foreground">:کۆی کاڵاکان</span>
                    <span className="font-semibold">{new Intl.NumberFormat('en-US').format(subTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <span className="text-muted-foreground">:داشکاندن</span>
                    <span className="font-semibold text-destructive">-{new Intl.NumberFormat('en-US').format(discountAmount)}</span>
                </div>
                 <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <span className="text-muted-foreground">:کۆی گشتی</span>
                    <span className="font-bold text-lg">{new Intl.NumberFormat('en-US').format(totalAmount)}</span>
                </div>
                 {form.watch('paymentType') === 'Installments' && (
                    <>
                        <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                            <span className="text-muted-foreground">:دراوە</span>
                            <span className="font-semibold text-accent">{new Intl.NumberFormat('en-US').format(totalPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-destructive/10 text-destructive">
                            <span className="">:ماوە</span>
                            <span className="font-bold">{new Intl.NumberFormat('en-US').format(remainingBalance)}</span>
                        </div>
                    </>
                 )}
            </div>
        </div>
        
        {form.watch('paymentType') === 'Installments' && (
             <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">پارە وەرگیراوەکان (قیست)</h3>
                <Table>
                    <TableHeader><TableRow><TableHead className="w-1/4 text-center">بەروار</TableHead><TableHead className="text-center">بڕ</TableHead><TableHead className="text-center">شێواز</TableHead><TableHead className="text-center">تێبینی</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paymentFields.map((field, index) => (
                           <TableRow key={field.id}>
                               <TableCell>
                                 <FormField
                                    control={form.control}
                                    name={`payments.${index}.date`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}
                                                    >
                                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP", { locale: arSA }) : (<span>بەروار</span>)}
                                                    </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start" dir="ltr">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={arSA}/>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               </TableCell>
                               <TableCell><FormField control={form.control} name={`payments.${index}.amount`} render={({ field }) => ( <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage/></FormItem>)}/></TableCell>
                               <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`payments.${index}.method`}
                                  render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
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
                <Button type="button" variant="outline" size="sm" onClick={() => appendPayment({ date: new Date(), amount: 0, method: 'Cash', note:'' })}>
                    <PlusCircle className="ml-2 h-4 w-4" /> زیادکردنی پارەدان
                </Button>
            </div>
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

    