
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, setDoc, getDoc, runTransaction } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { WithId } from "@/firebase/firestore/use-collection";
import { analyzePurchaseExcel } from "@/ai/flows/analyze-purchase-excel";
import * as XLSX from 'xlsx';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Textarea } from "@/components/ui/textarea";

// Define Supplier type based on your Firestore structure
type Supplier = {
  id: string;
  supplierName: string;
};

const buyingFormSchema = z.object({
  supplierId: z.string().min(1, "دابینکەر پێویستە."),
  issueDate: z.date({ required_error: "بەرواری دەرکردن پێویستە." }),
  items: z.array(z.object({
    product: z.string().min(1, "بابەت پێویستە."),
    category: z.string().min(1, "پۆل پێویستە."),
    sizeModel: z.string().optional(),
    quantity: z.coerce.number().min(1, "دانە دەبێت لانیکەم 1 بێت."),
    unitPrice: z.coerce.number().min(0, "نرخ پێویستە."),
  })).min(1, { message: "لانیکەم یەک کاڵا پێویستە." }),
  customsFee: z.coerce.number().optional().default(0),
  stockLocation: z.enum(["Warehouse", "Shop Showroom"]),
});

type BuyingFormValues = z.infer<typeof buyingFormSchema>;

function ExcelImportButton({ form }: { form: UseFormReturn<BuyingFormValues> }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target?.result;
                if (!(data instanceof ArrayBuffer)) {
                    toast({ variant: 'destructive', title: "هەڵە لە خوێندنەوەی فایل" });
                    setIsLoading(false);
                    return;
                }
                
                try {
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const csvData = XLSX.utils.sheet_to_csv(worksheet);

                    const result = await analyzePurchaseExcel({ excelDataAsCsv: csvData });
                    
                    const currentItems = form.getValues('items');
                    let newItems = result.map(item => ({ ...item, category: 'Mattress', sizeModel: '' }));

                    if (currentItems.length === 1 && !currentItems[0].product && currentItems[0].quantity === 1 && currentItems[0].unitPrice === 0) {
                       form.setValue('items', newItems);
                    } else {
                        form.setValue('items', [...form.getValues('items'), ...newItems]);
                    }

                    if (result && result.length > 0) {
                        toast({ title: "سەرکەوتوو بوو", description: `${result.length} کاڵا بە سەرکەوتوویی زیادکرا.` });
                    } else {
                        toast({ variant: 'destructive', title: "هیچ کاڵایەک نەدۆزرایەوە", description: "دڵنیابە فایلەکە ستوونی ناوی کاڵا، دانە، و نرخی تێدایە." });
                    }
                } catch (aiError: any) {
                     console.error("AI analysis failed:", aiError);
                     if (aiError.message && aiError.message.includes('503 Service Unavailable')) {
                        toast({ variant: 'destructive', title: "خزمەتگوزاری سەرقاڵە", description: "مۆدێلی AI لەکارکەوتووە. تکایە چەند خولەکێکی تر هەوڵبدەرەوە." });
                     } else {
                        toast({ variant: 'destructive', title: "هەڵە لە شیکردنەوەی فایل", description: "AI نەیتوانی داتاکان دەربهێنێت." });
                     }
                } finally {
                    setIsLoading(false);
                     if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            };
            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error("File processing error:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "شیکردنەوەی فایلەکە سەرکەوتوو نەبوو." });
            setIsLoading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
            <Button type="button" variant="outline" onClick={handleClick} disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ...شیکردنەوە
                    </>
                ) : (
                    <>
                        <Download className="ml-2 h-4 w-4" />
                        هاوردەکردن لە ئێکسڵ
                    </>
                )}
            </Button>
        </>
    );
}


export function BuyingForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suppliers');
  }, [firestore]);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersQuery);

  const form = useForm<BuyingFormValues>({
    resolver: zodResolver(buyingFormSchema),
    defaultValues: {
      supplierId: "",
      issueDate: new Date(),
      items: [{ product: "", quantity: 1, unitPrice: 0, category: "Mattress", sizeModel: "" }],
      customsFee: 0,
      stockLocation: "Warehouse",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch('items');
  const customsFee = form.watch('customsFee');
  
  const subTotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalAmount = subTotal + (customsFee || 0);

  async function onSubmit(data: BuyingFormValues) {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
        });
        return;
    }
    
    try {
        const buyingFormRef = doc(collection(firestore, "buying_forms"));
        const buyingFormId = buyingFormRef.id;

        const { items, ...mainData } = data;

        const buyingFormData = {
            ...mainData,
            id: buyingFormId,
            issueDate: format(data.issueDate, "yyyy-MM-dd"),
        };

        await setDoc(buyingFormRef, buyingFormData);

        const productPromises = items.map(async (item) => {
            const productDocId = item.product.toLowerCase().replace(/\s+/g, '-');
            const productRef = doc(firestore, 'products', productDocId);
            const productSubCollectionRef = doc(collection(firestore, `buying_forms/${buyingFormId}/products`));
            
            const productData = {
                id: productSubCollectionRef.id,
                buyingFormId: buyingFormId,
                productId: productDocId,
                productName: item.product,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                landedCost: item.unitPrice, // Placeholder, can be adjusted
            };
            
            await setDoc(productSubCollectionRef, productData);
            
            // Update stock in products collection
            await runTransaction(firestore, async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    transaction.set(productRef, {
                        id: productDocId,
                        productName: item.product,
                        category: item.category,
                        sizeModel: item.sizeModel || "",
                        stockLocation: data.stockLocation,
                        currentQuantity: item.quantity,
                        supplierId: data.supplierId,
                    });
                } else {
                    const newQuantity = (productDoc.data().currentQuantity || 0) + item.quantity;
                    transaction.update(productRef, { 
                        currentQuantity: newQuantity,
                        supplierId: data.supplierId, // Update supplier to the latest one
                    });
                }
            });
        });

        await Promise.all(productPromises);
        
        toast({
            title: "سەرکەوتوو بوو!",
            description: "پسوولەی کڕین بە سەرکەوتوویی پاشەکەوت کرا و کۆگا نوێکرایەوە.",
            className: "bg-accent text-accent-foreground",
        });
        form.reset();

    } catch (error: any) {
        console.error("Error saving buying form:", error);
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: error.message || "پاشەکەوتکردنی پسوولەی کڕین سەرکەوتوو نەبوو.",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
        <div className="flex justify-between items-start p-1 border-b pb-4">
             <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                        <FormLabel className="mt-2">بەروار:</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[180px] justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {field.value ? (
                                    format(field.value, "yyyy/MM/dd")
                                    ) : (
                                    <span>بەروارێک</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1 pt-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>دابینکەر</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingSuppliers ? "..." : "دابینکەرێک هەڵبژێرە"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {suppliers?.map((supplier: WithId<Supplier>) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.supplierName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="stockLocation"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>شوێنی دانان</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="شوێنێک هەڵبژێرە" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Warehouse">کۆگا</SelectItem>
                                <SelectItem value="Shop Showroom">فرۆشگا</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="relative border-t pt-6">
            <Table>
                <TableHeader>
                    <TableRow className="bg-primary/90 hover:bg-primary">
                        <TableHead className="w-[30%] text-primary-foreground">بابەت</TableHead>
                        <TableHead className="w-[20%] text-primary-foreground">پۆل</TableHead>
                        <TableHead className="text-primary-foreground">دانە</TableHead>
                        <TableHead className="text-primary-foreground">نرخی تاک</TableHead>
                        <TableHead className="text-primary-foreground">نرخی کۆ</TableHead>
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
                                      <Textarea placeholder="ناوی کاڵا و سایز" {...field} className="h-10"/>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                            </TableCell>
                            <TableCell className="align-top">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.category`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Mattress">دۆشەک</SelectItem>
                                            <SelectItem value="Bed">تەخت</SelectItem>
                                            <SelectItem value="Pillow">سەرین</SelectItem>
                                            <SelectItem value="Cover">بەرگ</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell className="align-top">
                                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </TableCell>
                            <TableCell className="align-top">
                                <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (<FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </TableCell>
                             <TableCell className="align-top pt-5 font-semibold">
                                {new Intl.NumberFormat('en-US').format(watchedItems[index]?.quantity * watchedItems[index]?.unitPrice || 0)}
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
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ product: "", quantity: 1, unitPrice: 0, category: 'Mattress', sizeModel: '' })}>
                <PlusCircle className="ml-2 h-4 w-4" />
                زیادکردنی کاڵا
            </Button>
        </div>

        <div className="flex justify-between items-start gap-8 pt-6 border-t">
            <div className="space-y-4 flex-1">
                 <ExcelImportButton form={form} />
            </div>
            <div className="space-y-2 text-left min-w-[280px]">
                <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <span className="text-muted-foreground">:کۆی کاڵاکان</span>
                    <span className="font-semibold">{new Intl.NumberFormat('en-US').format(subTotal)}</span>
                </div>
                 <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <FormField
                        control={form.control}
                        name="customsFee"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between w-full">
                                <FormLabel className="text-muted-foreground">:گومرگ</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} className="w-32" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary/80">
                    <span className="font-bold">:کۆی گشتی</span>
                    <span className="font-bold text-lg">{new Intl.NumberFormat('en-US').format(totalAmount)}</span>
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "...پاشەکەوت دەکرێت" : "پاشەکەوتکردنی پسوولە"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
