
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, collection, doc, updateDoc } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";

const customerSchema = z.object({
  customerName: z.string().min(1, { message: "ناوی کڕیار پێویستە." }),
  customerPhoneNumber: z.string().optional(),
  customerAddress: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface AddCustomerFormProps {
  onCustomerAdded?: () => void;
  customerId?: string;
  initialData?: CustomerFormValues;
}

export function AddCustomerForm({ onCustomerAdded, customerId, initialData }: AddCustomerFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      customerName: "",
      customerPhoneNumber: "",
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
      if (customerId) {
        const customerRef = doc(firestore, "customers", customerId);
        await updateDoc(customerRef, data);
        toast({
          title: "سەرکەوتوو بوو!",
          description: "زانیارییەکانی کڕیار بە سەرکەوتوویی نوێکرایەوە.",
          className: "bg-accent text-accent-foreground",
        });
      } else {
        const customersColRef = collection(firestore, "customers");
        addDocumentNonBlocking(customersColRef, data);
        toast({
          title: "سەرکەوتوو بوو!",
          description: "کڕیاری نوێ بە سەرکەوتوویی زیادکرا.",
          className: "bg-accent text-accent-foreground",
        });
      }
      
      form.reset();
      if (onCustomerAdded) {
        onCustomerAdded();
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "پاشەکەوتکردنی زانیارییەکان سەرکەوتوو نەبوو.",
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
          name="customerPhoneNumber"
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
