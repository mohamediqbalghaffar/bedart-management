
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
import { parseISO } from "date-fns";
import { format } from "date-fns-jalali";
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
  issueDate: z.string().min(1, "بەرواری دەرکردن پێویستە."),
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
      date: z.string().min(1, { message: "بەرواری پارەدان پێویستە." }),
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

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      formNumber: "0",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
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
    
    const sellingFormRef = formId ? doc(firestore, "selling_forms", formId) : doc(collection(firestore, "selling_forms"));
    const sellingFormId = sellingFormRef.id;

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Restore original stock for existing items (if editing)
            if (formId) {
                for (const item of originalItems) {
                    const productDocId = item.productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const productRef = doc(firestore, 'products', productDocId);
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        const newQuantity = (productDoc.data().currentQuantity || 0) + item.quantity;
                        transaction.update(productRef, { currentQuantity: newQuantity });
                    }
                }
            }

            // 2. Validate and deduct new stock
            for (const item of data.items) {
                const productDocId = item.product.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const productRef = doc(firestore, 'products', productDocId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error(`کاڵای "${item.product}" لە کۆگا نەدۆزرایەوە.`);
                }

                const currentQuantity = productDoc.data().currentQuantity || 0;
                if (currentQuantity < item.quantity) {
                    throw new Error(`بڕی کاڵا بەشی ناکات. تەنها ${currentQuantity} دانە لە "${item.product}" لە کۆگا ماوە.`);
                }

                const newQuantity = currentQuantity - item.quantity;
                transaction.update(productRef, { currentQuantity: newQuantity });
            }

            // 3. Create/Update the main selling_form document
            const { items, payments, ...mainData } = data;
            const sellingFormData: any = {
                ...mainData,
                id: sellingFormId,
                creatorId: "system", // Replace with actual user ID if auth is used
                issueDate: data.issueDate,
                totalPrice: totalAmount,
                remainingBalance: remainingBalance,
            };
            if (sellingFormData.discountValue === undefined || sellingFormData.discountValue === null) {
                sellingFormData.discountValue = 0;
            }
            if (sellingFormData.discountType === undefined || sellingFormData.discountType === null) {
                 delete sellingFormData.discountType;
            }

            transaction.set(sellingFormRef, sellingFormData, { merge: true });

            // 4. Clear and create new sub-collection documents
            if (formId) {
                const existingItemsSnap = await getDocs(collection(firestore, `selling_forms/${formId}/products`));
                existingItemsSnap.docs.forEach(d => transaction.delete(d.ref));
                const existingPaymentsSnap = await getDocs(collection(firestore, `selling_forms/${formId}/payments`));
                existingPaymentsSnap.docs.forEach(p => transaction.delete(p.ref));
            }
            
            items.forEach(item => {
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
                transaction.set(productSubCollectionRef, productData);
            });
        });
        
        // Handle payments outside the main transaction, as they don't affect stock
        const paymentPromises = (data.payments || []).map(payment => {
            const paymentRef = doc(collection(firestore, `selling_forms/${sellingFormId}/payments`));
            const paymentData = {
                ...payment,
                id: paymentRef.id,
                paymentDate: payment.date,
                sellingFormId: sellingFormId,
            };
            return setDocumentNonBlocking(paymentRef, paymentData, { merge: true });
        });
        await Promise.all(paymentPromises);

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
            description: error.message || "پاشەکەوتکردنی فۆڕمی فرۆشتن سەرکەوتوو نەبوو. گۆڕانکارییەکان پاشگەزکرانەوە.",
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
                        <FormControl>
                            <Input placeholder="YYYY-MM-DD" {...field} className="w-[180px]" />
                        </FormControl>
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
                                            <FormControl>
                                                <Input placeholder="YYYY-MM-DD" {...field} />
                                            </FormControl>
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
                <Button type="button" variant="outline" size="sm" onClick={() => appendPayment({ date: format(new Date(), "yyyy-MM-dd"), amount: 0, method: 'Cash', note:'' })}>
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

    