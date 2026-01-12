
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDoc, collection } from "@/firebase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const expenseSchema = z.object({
  name: z.string().min(1, { message: "ناوی خەرجی پێویستە." }),
  note: z.string().optional(),
  paidBy: z.enum(['Cash - Dinar', 'Cash - Dollar']),
  amount: z.coerce.number().min(1, "بڕی خەرجی دەبێت لانیکەم 1 بێت."),
  category: z.enum(['Daily', 'Salary', 'Rent', 'Electricity', 'Transport', 'Other']),
  date: z.date({ required_error: "بەرواری خەرجی پێویستە." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseForm({ onExpenseAdded }: { onExpenseAdded?: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      note: "",
      paidBy: 'Cash - Dinar',
      amount: 0,
      category: 'Daily',
      date: new Date(),
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

    try {
      const expensesColRef = collection(firestore, "expenses");
      
      await addDoc(expensesColRef, {
        ...data,
        date: format(data.date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      });

      toast({
        title: "سەرکەوتوو بوو!",
        description: "خەرجی نوێ بە سەرکەوتوویی زیادکرا.",
        className: "bg-accent text-accent-foreground",
      });
      form.reset();
      if (onExpenseAdded) {
        onExpenseAdded();
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: error.message || "زیادکردنی خەرجی سەرکەوتوو نەبوو.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ناوی خەرجی</FormLabel>
              <FormControl>
                <Input placeholder="بۆ نموونە: کڕینی چا و قاوە" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تێبینی</FormLabel>
              <FormControl>
                <Textarea placeholder="تێبینی بنووسە (ئارەزوومەندانە)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="paidBy"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>شێوازی پارەدان</FormLabel>
                <FormControl>
                    <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-2 space-x-reverse"
                        dir="rtl"
                    >
                        <FormItem className="flex items-center space-x-1 space-x-reverse">
                            <FormControl><RadioGroupItem value="Cash - Dinar" /></FormControl>
                            <FormLabel className="font-normal">کاش - دینار</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-x-reverse">
                            <FormControl><RadioGroupItem value="Cash - Dollar" /></FormControl>
                            <FormLabel className="font-normal">کاش - دۆلار</FormLabel>
                        </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>بڕی خەرجی</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>پۆلی خەرجی</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="پۆلێک هەڵبژێرە" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Daily">ڕۆژانە</SelectItem>
                            <SelectItem value="Salary">مووچە</SelectItem>
                            <SelectItem value="Rent">کرێ</SelectItem>
                            <SelectItem value="Electricity">کارەبا</SelectItem>
                            <SelectItem value="Transport">گواستنەوە</SelectItem>
                            <SelectItem value="Other">هەمەجۆر</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>بەروار</FormLabel>
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
                                format(field.value, "PPP", { locale: arSA })
                                ) : (
                                <span>بەروارێک هەڵبژێرە</span>
                                )}
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" dir="ltr">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date);
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
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "...پاشەکەوت دەکرێت" : "پاشەکەوتکردن"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
