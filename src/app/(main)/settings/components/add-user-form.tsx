'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, doc, collection, setDoc } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(1, { message: "ناوی بەکارهێنەر پێویستە." }),
  code: z.string().min(1, { message: "کۆدی نهێنی پێویستە."}),
  role: z.enum(['Admin', 'Data Manager', 'Salesman'], { required_error: "ڕۆڵ پێویستە."}),
});

type UserFormValues = z.infer<typeof userSchema>;

export function AddUserForm({ onUserAdded }: { onUserAdded?: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      code: "",
      role: "Salesman",
    },
  });

  async function onSubmit(data: UserFormValues) {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "هەڵەیەک ڕوویدا",
        description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
      });
      return;
    }

    try {
        const userRef = doc(collection(firestore, 'users'));
        await setDoc(userRef, { ...data, id: userRef.id });

        toast({
            title: "سەرکەوتوو بوو!",
            description: "بەکارهێنەری نوێ بە سەرکەوتوویی زیادکرا.",
            className: "bg-accent text-accent-foreground",
        });
        form.reset();
        if (onUserAdded) {
            onUserAdded();
        }

    } catch (error) {
        console.error("Error creating user:", error);
        toast({ variant: 'destructive', title: "Error creating user" });
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
              <FormLabel>ناوی بەکارهێنەر</FormLabel>
              <FormControl>
                <Input placeholder="ناوی تەواو" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>کۆدی نهێنی</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>ڕۆڵ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Admin">بەڕێوەبەر</SelectItem>
                            <SelectItem value="Data Manager">داتا مانجەر</SelectItem>
                            <SelectItem value="Salesman">فرۆشیار</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />...پاشەکەوت دەکرێت</> : "دروستکردنی بەکارهێنەر"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
