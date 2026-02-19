'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDoc, collection, doc, setDoc } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCategory } from "@/lib/types";

const productSchema = z.object({
  productName: z.string().min(1, { message: "ناوی کاڵا پێویستە." }),
  category: z.enum(['Mattress', 'Bed', 'Pillow', 'Cover'], { required_error: "پۆل پێویستە."}),
});

type ProductFormValues = z.infer<typeof productSchema>;

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];
const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};

export function AddProductForm({ onProductAdded }: { onProductAdded?: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      category: "Mattress",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
      });
      return;
    }

    try {
        const docRef = doc(collection(firestore, 'product_definitions'));
        await setDoc(docRef, { ...data, id: docRef.id, sellingPrice: 0 });

        toast({
            title: "سەرکەوتوو بوو!",
            description: "پێناسەی کاڵای نوێ بە سەرکەوتوویی زیادکرا.",
            className: "bg-accent text-accent-foreground",
        });
        form.reset();
        if (onProductAdded) {
            onProductAdded();
        }

    } catch (error) {
         console.error("Error adding product definition:", error);
         toast({ variant: "destructive", title: "هەڵە", description: "زیادکردنی پێناسەی کاڵا سەرکەوتوو نەبوو." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ناوی کاڵا</FormLabel>
              <FormControl>
                <Input placeholder="ناوی تەواوی کاڵا" {...field} />
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
                    <FormLabel>پۆل</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {productCategories.map(cat => <SelectItem key={cat} value={cat}>{categoryTranslations[cat]}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
