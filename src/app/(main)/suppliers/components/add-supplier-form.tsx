
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";

const supplierSchema = z.object({
  supplierName: z.string().min(1, { message: "ناوی دابینکەر پێویستە." }),
  contactInformation: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export function AddSupplierForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
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
      const suppliersColRef = collection(firestore, "suppliers");
      const newSupplierRef = doc(suppliersColRef);
      
      await addDocumentNonBlocking(suppliersColRef, {
        id: newSupplierRef.id,
        ...data,
      });

      toast({
        title: "سەرکەوتوو بوو!",
        description: "دابینکەری نوێ بە سەرکەوتوویی زیادکرا.",
        className: "bg-accent text-accent-foreground",
      });
      form.reset();
      // Here you might want to close the dialog
    } catch (error: any) {
      console.error("Error adding supplier:", error);
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: error.message || "زیادکردنی دابینکەر سەرکەوتوو نەبوو.",
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
