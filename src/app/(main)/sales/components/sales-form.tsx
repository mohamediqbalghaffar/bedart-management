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
  customerName: z.string().min(1, { message: "Customer name is required." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  issueDate: z.date({ required_error: "Issue date is required." }),
  items: z.array(z.object({
    product: z.string().min(1, "Product name is required."),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    unitPrice: z.coerce.number().min(0, "Price is required."),
  })).min(1, { message: "At least one product is required." }),
  deliveryCost: z.coerce.number().optional().default(0),
  paymentStatus: z.enum(["Unpaid", "Partially Paid", "Fully Paid"]),
  paymentType: z.enum(["After Delivery", "Installments", "Pre-order"]),
  payments: z.array(z.object({
      date: z.date(),
      amount: z.coerce.number().min(0.01, "Amount must be positive."),
      method: z.enum(["Cash", "Transfer"]),
      note: z.string().optional(),
  })).optional(),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export function SalesForm() {
  const [formNumber, setFormNumber] = useState("");
  
  useEffect(() => {
    // Simulate auto-incrementing form number
    setFormNumber(`SALE-${String(Date.now()).slice(-6)}`);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1">
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Form Number</p>
                <p className="font-semibold">{formNumber}</p>
            </div>
             <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Issue Date</FormLabel>
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
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Pick a date</span>
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
          <h3 className="text-lg font-medium">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerName" render={({ field }) => ( <FormItem> <FormLabel>Customer Name</FormLabel> <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="customerPhone" render={({ field }) => ( <FormItem> <FormLabel>Customer Phone</FormLabel> <FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
          <FormField control={form.control} name="customerAddress" render={({ field }) => ( <FormItem> <FormLabel>Customer Address</FormLabel> <FormControl><Textarea placeholder="123 Main St, Anytown, USA" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
        </div>
        
        <div className="relative border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Products</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-2/5">Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Line Total</TableHead>
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
                                        <Input placeholder="Product name" {...field} onFocus={() => setActiveProductIndex(index)} />
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
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
            </Button>
        </div>

        <div className="space-y-4 p-1 border-t pt-6">
          <h3 className="text-lg font-medium">Payment Details</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField control={form.control} name="deliveryCost" render={({ field }) => ( <FormItem> <FormLabel>Delivery Cost</FormLabel> <FormControl><Input type="number" step="0.01" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="paymentType" render={({ field }) => ( <FormItem> <FormLabel>Payment Type</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select type" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="After Delivery">After Delivery</SelectItem> <SelectItem value="Installments">Installments</SelectItem> <SelectItem value="Pre-order">Pre-order</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => ( <FormItem> <FormLabel>Payment Status</FormLabel> <FormControl><Input {...field} readOnly className="font-semibold bg-secondary border-none" /></FormControl> <FormMessage /> </FormItem> )} />
           </div>
        </div>
        
        {form.watch('paymentType') === 'Installments' && (
             <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Payments Received</h3>
                <Table>
                    <TableHeader><TableRow><TableHead className="w-1/4">Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Note</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paymentFields.map((field, index) => (
                           <TableRow key={field.id}>
                               <TableCell><FormField control={form.control} name={`payments.${index}.date`} render={({ field }) => ( <FormItem><FormControl><Input type="date" {...field} onChange={e => field.onChange(e.target.valueAsDate)} value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} /></FormControl></FormItem>)}/></TableCell>
                               <TableCell><FormField control={form.control} name={`payments.${index}.amount`} render={({ field }) => ( <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)}/></TableCell>
                               <TableCell><FormField control={form.control} name={`payments.${index}.method`} render={({ field }) => ( <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Transfer">Transfer</SelectItem></SelectContent></Select></FormItem>)}/></TableCell>
                               <TableCell><FormField control={form.control} name={`payments.${index}.note`} render={({ field }) => ( <FormItem><FormControl><Input {...field} /></FormControl></FormItem>)}/></TableCell>
                               <TableCell><Button variant="ghost" size="icon" onClick={() => removePayment(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => appendPayment({ date: new Date(), amount: 0, method: 'Cash', note:'' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
                </Button>
            </div>
        )}

        <div className="flex justify-end items-start gap-8 pt-6 border-t text-right">
            <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Subtotal:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subTotal)}</p>
                <p><span className="text-muted-foreground">Delivery:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deliveryCost || 0)}</p>
                <p className="font-semibold text-base"><span className="text-muted-foreground">Total:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</p>
            </div>
             <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Paid:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPaid)}</p>
                <p className="font-semibold text-base"><span className="text-destructive">Balance:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remainingBalance)}</p>
            </div>
            <Button type="submit" size="lg">Save Form</Button>
        </div>
      </form>
    </Form>
  );
}
