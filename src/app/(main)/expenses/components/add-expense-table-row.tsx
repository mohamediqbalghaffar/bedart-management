'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, collection } from "@/firebase";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";

const expenseSchema = z.object({
  name: z.string().min(1, { message: "پێویستە." }),
  note: z.string().optional(),
  amount: z.coerce.number().min(0.01, "پێویستە.").max(1000000000, "بڕەکە زۆرە"),
  currency: z.enum(['USD', 'IQD']),
  category: z.enum(['Daily', 'Salary', 'Rent', 'Electricity', 'Transport', 'Other']),
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی هەڵە." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const categoryTranslations: { [key: string]: string } = {
    'Daily': 'ڕۆژانە', 'Salary': 'مووچە', 'Rent': 'کرێ', 'Electricity': 'کارەبا', 'Transport': 'گواستنەوە', 'Other': 'هەمەجۆر'
};

export function AddExpenseTableRow({ onExpenseAdded }: { onExpenseAdded: () => void }) {
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
      <TableRow className="bg-muted/10 hover:bg-muted/20 hidden md:table-row">
        <TableCell className="bg-card">
          <Button onClick={form.handleSubmit(onSubmit)} size="icon" variant="ghost" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 text-primary"/>}
          </Button>
        </TableCell>
        <TableCell className="bg-card">
          <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)}/>
        </TableCell>
        <TableCell className="bg-card">
          <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                  <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{Object.entries(categoryTranslations).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
          )}/>
        </TableCell>
        <TableCell className="bg-card">
          <div className="flex gap-2">
              <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem className="flex-grow"><FormControl><Input type="number" placeholder="0.00" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                      <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                          <FormControl><SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="IQD">IQD</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}/>
          </div>
        </TableCell>
        <TableCell className="bg-card">
          <FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormControl><Input placeholder="تێبینی..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </TableCell>
        <TableCell className="bg-card">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormControl><Input placeholder="ناوی خەرجی..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </TableCell>
      </TableRow>
    </Form>
  );
}
