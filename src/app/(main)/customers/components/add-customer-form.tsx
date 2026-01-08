
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";

const customerSchema = z.object({
  customerName: z.string().min(1, { message: "ناوی کڕیار پێویستە." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function AddCustomerForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
      });
      return;
    }

    try {
      const dummyFormRef = doc(collection(firestore, "selling_forms"));
      
      await setDocumentNonBlocking(dummyFormRef, {
        id: dummyFormRef.id,
        customerName: data.customerName,
        customerPhoneNumber: data.customerPhone,
        customerAddress: data.customerAddress,
        issueDate: new Date().toISOString().split('T')[0],
        totalPrice: 0,
        paymentStatus: 'Unpaid',
        paymentType: 'Pre-order',
        formNumber: `CUST-${Math.floor(Math.random() * 1000)}`,
        items: [],
      }, { merge: true });


      toast({
        title: "سەرکەوتوو بوو!",
        description: "کڕیاری نوێ بە سەرکەوتوویی زیادکرا.",
        className: "bg-accent text-accent-foreground",
      });
      form.reset();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: error.message || "زیادکردنی کڕیار سەرکەوتوو نەبوو.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ناوی کڕیار</FormLabel>
              <FormControl>
                <Input placeholder="ناوی تەواوی کڕیار" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ژمارەی تەلەفۆن</FormLabel>
              <FormControl>
                <Input placeholder="07XX XXX XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ناونیشان</FormLabel>
              <FormControl>
                <Textarea placeholder="ناونیشانی نیشتەجێبوون" {...field} />
              </FormControl>
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
