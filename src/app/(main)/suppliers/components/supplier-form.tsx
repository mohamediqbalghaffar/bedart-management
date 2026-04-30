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

const supplierSchema = z.object({
  supplierName: z.string().min(1, { message: "ناوی دابینکەر پێویستە." }),
  contactInformation: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  onSuccess?: () => void;
  initialData?: SupplierFormValues;
  supplierId?: string;
}

export function SupplierForm({ onSuccess, initialData, supplierId }: SupplierFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {
      supplierName: "",
      contactInformation: "",
    },
  });

  async function onSubmit(data: SupplierFormValues) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
      });
      return;
    }

    try {
      if (supplierId) {
        // Update existing supplier
        const supplierRef = doc(firestore, "suppliers", supplierId);
        await updateDoc(supplierRef, data);
        toast({
          title: "سەرکەوتوو بوو!",
          description: "دابینکەر بە سەرکەوتوویی نوێکرایەوە.",
          className: "bg-accent text-accent-foreground",
        });
      } else {
        // Add new supplier
        const suppliersColRef = collection(firestore, "suppliers");
        addDocumentNonBlocking(suppliersColRef, data);
        toast({
          title: "سەرکەوتوو بوو!",
          description: "دابینکەری نوێ بە سەرکەوتوویی زیادکرا.",
          className: "bg-accent text-accent-foreground",
        });
      }
      
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "نەتوانرا زانیارییەکان پاشەکەوت بکرێن.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
        <FormField
          control={form.control}
          name="supplierName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ناوی دابینکەر</FormLabel>
              <FormControl>
                <Input placeholder="ناوی تەواوی دابینکەر" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactInformation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>زانیاری پەیوەندی</FormLabel>
              <FormControl>
                <Textarea placeholder="ژمارە تەلەفۆن، ناونیشان، ئیمەیڵ، هتد." {...field} />
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
