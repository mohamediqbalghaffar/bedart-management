"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SmartSuggestions } from "./smart-suggestions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const salesFormSchema = z.object({
  customerName: z.string().min(1, { message: "ناوی کڕیار پێویستە." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  issueDate: z.date({ required_error: "بەرواری دەرکردن پێویستە." }),
  items: z.array(z.object({
    product: z.string().min(1, "ناوی کاڵا پێویستە."),
    quantity: z.coerce.number().min(1, "دانە دەبێت لانیکەم 1 بێت."),
    unitPrice: z.coerce.number().min(0, "نرخ پێویستە."),
  })).min(1, { message: "لانیکەم یەک کاڵا پێویستە." }),
  deliveryCost: z.coerce.number().optional().default(0),
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

export function SalesForm() {
  const [formNumber, setFormNumber] = useState("");
  
  useEffect(() => {
    // Simulate auto-incrementing form number
    setFormNumber(`فرۆش-${String(Date.now()).slice(-6)}`);
  }, []);
  
  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      issueDate: new Date(),
      items: [{ product: "", quantity: 1, unitPrice: 0 }],
      deliveryCost: 0,
      paymentStatus: "Unpaid",
      paymentType: "After Delivery",
      payments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null);

  const watchedItems = form.watch('items');
  const deliveryCost = form.watch('deliveryCost');
  const watchedPayments = form.watch('payments');
  
  const subTotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalAmount = subTotal + (deliveryCost || 0);
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


  function onSubmit(data: SalesFormValues) {
    console.log({ formNumber, ...data });
    // Here you would typically send the data to your backend API
    // to save the sale, update stock, and create an expense for delivery.
  }

  const handleSelectSuggestion = (suggestion: string) => {
    if (activeProductIndex !== null) {
      form.setValue(`items.${activeProductIndex}.product`, suggestion);
      setActiveProductIndex(null);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1">
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ژمارەی فۆڕم</p>
                <p className="font-semibold">{formNumber}</p>
            </div>
             <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>بەرواری دەرکردن</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>بەروارێک هەڵبژێرە</span>
                                    )}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="space-y-4 p-1 border-t pt-6">
          <h3 className="text-lg font-medium">زانیاری کڕیار</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerName" render={({ field }) => ( <FormItem> <FormLabel>ناوی کڕیار</FormLabel> <FormControl><Input placeholder="بۆ نموونە: ئەحمەد عەلی" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="customerPhone" render={({ field }) => ( <FormItem> <FormLabel>ژمارەی تەلەفۆنی کڕیار</FormLabel> <FormControl><Input placeholder="0750 123 4567" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
          <FormField control={form.control} name="customerAddress" render={({ field }) => ( <FormItem> <FormLabel>ناونیشانی کڕیار</FormLabel> <FormControl><Textarea placeholder="شەقامی 123، گەڕەکی هەرێم، شار" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
        </div>
        
        <div className="relative border-t pt-6">
            <h3 className="text-lg font-medium mb-2">کاڵاکان</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-2/5">کاڵا</TableHead>
                        <TableHead>دانە</TableHead>
                        <TableHead>نرخی تاک</TableHead>
                        <TableHead>کۆی نرخ</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((field, index) => (
                        <TableRow key={field.id}>
                            <TableCell className="align-top">
                                <FormField control={form.control} name={`items.${index}.product`} render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="relative">
                                        <Input placeholder="ناوی کاڵا" {...field} onFocus={() => setActiveProductIndex(index)} />
                                        {activeProductIndex === index && (
                                          <SmartSuggestions
                                              searchTerm={form.watch(`items.${index}.product`)}
                                              onSelect={handleSelectSuggestion}
                                              onClose={() => setActiveProductIndex(null)}
                                          />
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                            </TableCell>
                            <TableCell className="align-top">
                                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </TableCell>
                            <TableCell className="align-top">
                                <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (<FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </TableCell>
                             <TableCell className="align-top pt-5">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(watchedItems[index]?.quantity * watchedItems[index]?.unitPrice || 0)}
                            </TableCell>
                            <TableCell className="align-top">
                                <Button variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ product: "", quantity: 1, unitPrice: 0 })}>
                <PlusCircle className="ml-2 h-4 w-4" />
                زیادکردنی کاڵا
            </Button>
        </div>

        <div className="space-y-4 p-1 border-t pt-6">
          <h3 className="text-lg font-medium">زانیاری پارەدان</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField control={form.control} name="deliveryCost" render={({ field }) => ( <FormItem> <FormLabel>تێچووی گەیاندن</FormLabel> <FormControl><Input type="number" step="0.01" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="paymentType" render={({ field }) => ( <FormItem> <FormLabel>شێوازی پارەدان</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="جۆرێک هەڵبژێرە" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="After Delivery">دوای گەیاندن</SelectItem> <SelectItem value="Installments">قیست</SelectItem> <SelectItem value="Pre-order">داواکاری پێشوەختە</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => ( <FormItem> <FormLabel>دۆخی پارەدان</FormLabel> <FormControl><Input {...field} readOnly className="font-semibold bg-secondary border-none" /></FormControl> <FormMessage /> </FormItem> )} />
           </div>
        </div>
        
        {form.watch('paymentType') === 'Installments' && (
             <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">پارە وەرگیراوەکان</h3>
                <Table>
                    <TableHeader><TableRow><TableHead className="w-1/4">بەروار</TableHead><TableHead>بڕ</TableHead><TableHead>شێواز</TableHead><TableHead>تێبینی</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paymentFields.map((field, index) => (
                           <TableRow key={field.id}>
                               <TableCell>
                                 <FormField
                                    control={form.control}
                                    name={`payments.${index}.date`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                                        {field.value ? (
                                                        format(field.value, "PPP")
                                                        ) : (
                                                        <span>بەروارێک هەڵبژێرە</span>
                                                        )}
                                                    </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
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
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <div className="flex justify-end items-start gap-8 pt-6 border-t text-left">
            <div className="space-y-1 text-sm">
                <p>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subTotal)} <span className="text-muted-foreground">:کۆی گشتی</span></p>
                <p>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deliveryCost || 0)} <span className="text-muted-foreground">:گەیاندن</span></p>
                <p className="font-semibold text-base">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)} <span className="text-muted-foreground">:کۆی گشتی</span></p>
            </div>
             <div className="space-y-1 text-sm">
                <p>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPaid)} <span className="text-muted-foreground">:دراوە</span></p>
                <p className="font-semibold text-base">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remainingBalance)} <span className="text-destructive">:ماوە</span></p>
            </div>
            <Button type="submit" size="lg">پاشەکەوتکردنی فۆڕم</Button>
        </div>
      </form>
    </Form>
  );
}

    