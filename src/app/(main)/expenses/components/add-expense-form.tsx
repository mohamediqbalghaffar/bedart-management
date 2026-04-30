'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, collection } from "@/firebase";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2 } from "lucide-react";

const expenseSchema = z.object({
  name: z.string().min(1, { message: "پێویستە." }),
  note: z.string().optional(),
  amount: z.coerce.number().min(0.01, "پێویستە."),
  currency: z.enum(['USD', 'IQD']),
  category: z.enum(['Daily', 'Salary', 'Rent', 'Electricity', 'Transport', 'Other']),
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی هەڵە." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const categoryTranslations: { [key: string]: string } = {
    'Daily': 'ڕۆژانە', 'Salary': 'مووچە', 'Rent': 'کرێ', 'Electricity': 'کارەبا', 'Transport': 'گواستنەوە', 'Other': 'هەمەجۆر'
};

export function AddExpenseForm({ onExpenseAdded }: { onExpenseAdded: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      note: "",
      amount: 0,
      currency: 'USD',
      category: 'Daily',
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(data: ExpenseFormValues) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
      });
      return;
    }

    const expensesColRef = collection(firestore, "expenses");
    
    addDocumentNonBlocking(expensesColRef, { ...data });

    toast({
      title: "سەرکەوتوو بوو!",
      description: "خەرجی نوێ بە سەرکەوتوویی زیادکرا.",
      className: "bg-accent text-accent-foreground",
    });
    form.reset();
    onExpenseAdded();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>ناوی خەرجی</FormLabel><FormControl><Input placeholder="ناوی خەرجی..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormLabel>تێبینی</FormLabel><FormControl><Input placeholder="تێبینی..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="flex gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel>بڕ</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem className="w-[100px]">
                   <FormLabel>دراو</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="IQD">IQD</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
          )}/>
        </div>
        <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                  <FormLabel>پۆل</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{Object.entries(categoryTranslations).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
        )}/>
        <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>بەروار</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2"/> : null}
                پاشەکەوتکردن
            </Button>
        </div>
      </form>
    </Form>
  );
}
