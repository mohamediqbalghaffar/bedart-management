
"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, UseFormReturn, Control } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Download, Loader2, PlusCircle, Trash2, List, FileUp } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, setDoc, getDoc, runTransaction, getDocs, deleteDoc, DocumentSnapshot } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { WithId } from "@/firebase/firestore/use-collection";
import { analyzePurchaseExcel } from "@/ai/flows/analyze-purchase-excel";
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductSelectorDialog } from "../../components/product-selector-dialog";
import { useDebounce } from "@/hooks/use-debounce";


// Define types based on your Firestore structure
type Supplier = {
  id: string;
  supplierName: string;
};

type Product = {
    productName: string;
    sellingPrice?: number;
    unitPrice?: number;
}

const buyingFormSchema = z.object({
  supplierId: z.string().min(1, "دابینکەر پێویستە."),
  issueDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی بەروار هەڵەیە (YYYY-MM-DD)." }),
  items: z.array(z.object({
    product: z.string().min(1, "بابەت پێویستە."),
    category: z.string().min(1, "پۆل پێویستە."),
    sizeModel: z.string().optional(),
    quantity: z.coerce.number().min(1, "دانە دەبێت لانیکەم 1 بێت."),
    unitPrice: z.coerce.number().min(0, "نرخ پێویستە."),
    sellingPrice: z.coerce.number().min(0, "نرخی فرۆشتن پێویستە."),
  })).min(1, { message: "لانیکەم یەک کاڵا پێویستە." }),
  customsFee: z.coerce.number().optional().default(0),
  stockLocation: z.enum(["Warehouse", "Shop Showroom"]),
});

type BuyingFormValues = z.infer<typeof buyingFormSchema>;

type BuyingFormProps = {
    formId?: string | null;
    onSave?: () => void;
};

function TemplateDownloadButton() {
    const { toast } = useToast();

    const handleDownload = () => {
        try {
            const templateData = [
                { product: "Mattress A", quantity: 10, unitPrice: 150, sellingPrice: 250 },
                { product: "Pillow B", quantity: 20, unitPrice: 25, sellingPrice: 40 },
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

            // Set column widths
            worksheet['!cols'] = [
                { wch: 30 }, // product
                { wch: 10 }, // quantity
                { wch: 15 }, // unitPrice
                { wch: 15 }, // sellingPrice
            ];
            
            XLSX.writeFile(workbook, "Purchase_Template.xlsx");

            toast({ title: "سەرکەوتوو بوو", description: "داواکارییەکە بە سەرکەوتوویی دابەزێنرا." });

        } catch (error) {
             console.error("Template download error:", error);
             toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "دابەزاندنی داواکارییەکە سەرکەوتوو نەبوو." });
        }
    }

    return (
        <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
            <Download className="ml-2 h-4 w-4" />
            دابەزاندنی داواکاری
        </Button>
    )
}

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
                    let newItems = result.map(item => ({ ...item, category: 'Mattress', sizeModel: '', sellingPrice: 0 }));

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
            <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ...شیکردنەوە
                    </>
                ) : (
                    <>
                        <FileUp className="ml-2 h-4 w-4" />
                        هاوردەکردن لە ئێکسڵ
                    </>
                )}
            </Button>
        </>
    );
}

function BuyingFormItemRow({
    form,
    index,
    remove,
    fieldId,
    products
}: {
    form: UseFormReturn<BuyingFormValues>;
    index: number;
    remove: (index: number) => void;
    fieldId: string;
    products: WithId<Product>[] | null
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const watchedItem = form.watch(`items.${index}`);
    const debouncedProductName = useDebounce(watchedItem.product, 500);

    useEffect(() => {
        if (debouncedProductName && products) {
            const foundProduct = products.find(p => p.productName.toLowerCase() === debouncedProductName.toLowerCase());
            if (foundProduct) {
                form.setValue(`items.${index}.sellingPrice`, foundProduct.sellingPrice || 0);
            } else {
                form.setValue(`items.${index}.sellingPrice`, 0);
            }
        }
    }, [debouncedProductName, products, form, index]);
    
    return (
        <TableRow key={fieldId}>
            <TableCell className="align-top">
                <FormField
                    control={form.control}
                    name={`items.${index}.product`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input placeholder="ناوی کاڵا..." {...field} />
                                </FormControl>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon"><List className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-3xl">
                                        <DialogHeader>
                                            <DialogTitle>لیستی کاڵاکان</DialogTitle>
                                        </DialogHeader>
                                        <ProductSelectorDialog onProductSelect={({ name, price, purchasePrice }) => {
                                            form.setValue(`items.${index}.product`, name);
                                            form.setValue(`items.${index}.sellingPrice`, price);
                                            form.setValue(`items.${index}.unitPrice`, purchasePrice || 0);
                                            setDialogOpen(false);
                                        }} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
            <TableCell className="align-top">
                <FormField control={form.control} name={`items.${index}.sellingPrice`} render={({ field }) => (<FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </TableCell>
            <TableCell className="align-top pt-5 font-semibold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(watchedItem?.quantity * watchedItem?.unitPrice || 0)}
            </TableCell>
            <TableCell className="align-top">
                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

export function BuyingForm({ onSave, formId }: BuyingFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [originalItems, setOriginalItems] = useState<any[]>([]);

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suppliers');
  }, [firestore]);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersQuery);
  
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: products } = useCollection<Product>(productsQuery);

  const form = useForm<BuyingFormValues>({
    resolver: zodResolver(buyingFormSchema),
    defaultValues: {
      supplierId: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      items: [{ product: "", quantity: 1, unitPrice: 0, sellingPrice: 0, category: "Mattress", sizeModel: "" }],
      customsFee: 0,
      stockLocation: "Warehouse",
    },
  });

  useEffect(() => {
    async function fetchFormData() {
      if (formId && firestore) {
        setIsLoadingData(true);
        try {
          const formRef = doc(firestore, 'buying_forms', formId);
          const formSnap = await getDoc(formRef);

          if (formSnap.exists()) {
            const data = formSnap.data();
            
            const itemsRef = collection(firestore, `buying_forms/${formId}/products`);
            const itemsSnap = await getDocs(itemsRef);
            const items = itemsSnap.docs.map(d => ({ ...d.data() }));

            setOriginalItems(items); // Store original items for stock calculation

            form.reset({
              ...data,
              issueDate: data.issueDate,
              items: items.map(item => ({
                  product: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  sellingPrice: item.sellingPrice || 0,
                  category: item.category || 'Mattress',
                  sizeModel: item.sizeModel || '',
              })),
            });
          }
        } catch (error) {
          console.error("Error fetching form data:", error);
          toast({ variant: 'destructive', title: "Error fetching data" });
        } finally {
          setIsLoadingData(false);
        }
      }
    }

    fetchFormData();
  }, [formId, firestore, form, toast]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch('items');
  const customsFee = form.watch('customsFee');
  
  const subTotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalAmount = subTotal + Number(customsFee || 0);

  async function onSubmit(data: BuyingFormValues) {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: "پەیوەندی لەگەڵ بنکەی داتاکەدا نییە.",
        });
        return;
    }
    
    const buyingFormRef = formId ? doc(firestore, "buying_forms", formId) : doc(collection(firestore, "buying_forms"));
    const buyingFormId = buyingFormRef.id;

    try {
        await runTransaction(firestore, async (transaction) => {
            const productRefsToUpdate: { ref: any; newQty: number, data: any }[] = [];
            const productRefsToCreate: { ref: any; data: any }[] = [];
            const productDocs = new Map<string, DocumentSnapshot>();

            // --- READ PHASE ---
            // Create a set of unique product IDs to read to avoid reading the same doc multiple times
            const uniqueProductIds = new Set<string>();

            // Add product IDs from original items (if editing)
            if (formId) {
                originalItems.forEach(item => uniqueProductIds.add(item.productId));
            }
            // Add product IDs from current form items
            data.items.forEach(item => uniqueProductIds.add(item.product.toLowerCase().replace(/[^a-z0-9]/g, '-')));

            // Batch read all unique product documents
            const productReads: Promise<DocumentSnapshot>[] = [];
            uniqueProductIds.forEach(id => {
                productReads.push(transaction.get(doc(firestore, 'products', id)));
            });

            const readSnapshots = await Promise.all(productReads);
            readSnapshots.forEach(snap => productDocs.set(snap.id, snap));

            // --- CALCULATION PHASE (no reads/writes) ---
            const stockAdjustments = new Map<string, number>();

            // 1. Calculate stock decrements from original items (for edits)
            if (formId) {
                for (const item of originalItems) {
                    const currentAdjustment = stockAdjustments.get(item.productId) || 0;
                    stockAdjustments.set(item.productId, currentAdjustment - item.quantity);
                }
            }

            // 2. Calculate stock increments from new/updated items
            for (const item of data.items) {
                const productDocId = item.product.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const currentAdjustment = stockAdjustments.get(productDocId) || 0;
                stockAdjustments.set(productDocId, currentAdjustment + item.quantity);
            }

            // --- WRITE PHASE ---
            
            // 3. Update stock quantities and product details
            for (const [productId, quantityChange] of stockAdjustments.entries()) {
                 const productRef = doc(firestore, 'products', productId);
                 const productDoc = productDocs.get(productId);
                 const formItemData = data.items.find(i => i.product.toLowerCase().replace(/[^a-z0-9]/g, '-') === productId);

                 if (productDoc && productDoc.exists()) {
                     const currentQuantity = productDoc.data()?.currentQuantity || 0;
                     const newQuantity = currentQuantity + quantityChange;
                     transaction.update(productRef, { 
                         currentQuantity: newQuantity,
                         ...(formItemData && { // Only update these if the product is in the current form
                            supplierId: data.supplierId, 
                            stockLocation: data.stockLocation, 
                            unitPrice: formItemData.unitPrice,
                            sellingPrice: formItemData.sellingPrice,
                         })
                     });
                 } else if (formItemData) { // This is a new product
                     transaction.set(productRef, {
                        id: productId,
                        productName: formItemData.product,
                        category: formItemData.category,
                        sizeModel: formItemData.sizeModel || "",
                        stockLocation: data.stockLocation,
                        currentQuantity: formItemData.quantity,
                        supplierId: data.supplierId,
                        unitPrice: formItemData.unitPrice,
                        sellingPrice: formItemData.sellingPrice,
                    });
                 }
            }

            // 4. Create/Update the main buying_form document
            const { items, ...mainData } = data;
            const buyingFormData = { ...mainData, id: buyingFormId };
            transaction.set(buyingFormRef, buyingFormData, { merge: true });

            // 5. Clear and create new sub-collection documents
            if (formId) {
                const existingItemsSnap = await getDocs(collection(firestore, `buying_forms/${formId}/products`));
                existingItemsSnap.docs.forEach(d => transaction.delete(d.ref));
            }
            
            items.forEach(item => {
                const productSubCollectionRef = doc(collection(firestore, `buying_forms/${buyingFormId}/products`));
                const productDocId = item.product.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const productData = {
                    id: productSubCollectionRef.id,
                    buyingFormId: buyingFormId,
                    productId: productDocId,
                    productName: item.product,
                    category: item.category,
                    sizeModel: item.sizeModel,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    sellingPrice: item.sellingPrice,
                    landedCost: item.unitPrice + ((customsFee || 0) / items.reduce((sum, i) => sum + i.quantity, 0)),
                };
                transaction.set(productSubCollectionRef, productData);
            });
        });


        toast({
            title: "سەرکەوتوو بوو!",
            description: `پسوولەی کڕین بە سەرکەوتوویی ${formId ? 'نوێکرایەوە' : 'پاشەکەوت کرا'}.`,
            className: "bg-accent text-accent-foreground",
        });
        if (onSave) onSave();
        if(!formId) form.reset();

    } catch (error: any) {
        console.error("Error saving buying form:", error);
        toast({
            variant: "destructive",
            title: "هەڵەیەک ڕوویدا",
            description: error.message || "پاشەکەوتکردنی پسوولەی کڕین سەرکەوتوو نەبوو.",
        });
    }
  }

  if (isLoadingData) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
                        <FormControl>
                            <Input placeholder="YYYY-MM-DD" {...field} className="w-[180px]" />
                        </FormControl>
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
                        <TableHead className="w-2/5 text-primary-foreground text-center">بابەت</TableHead>
                        <TableHead className="w-[15%] text-primary-foreground text-center">پۆل</TableHead>
                        <TableHead className="text-primary-foreground text-center">دانە</TableHead>
                        <TableHead className="text-primary-foreground text-center">نرخی کڕین (USD)</TableHead>
                        <TableHead className="text-primary-foreground text-center">نرخی فرۆشتن (USD)</TableHead>
                        <TableHead className="text-primary-foreground text-center">نرخی کۆ (USD)</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {fields.map((field, index) => (
                        <BuyingFormItemRow
                            key={field.id}
                            fieldId={field.id}
                            form={form}
                            index={index}
                            remove={() => fields.length > 1 && remove(index)}
                            products={products}
                        />
                    ))}
                </TableBody>
            </Table>
            <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product: "", quantity: 1, unitPrice: 0, sellingPrice: 0, category: 'Mattress', sizeModel: '' })}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    زیادکردنی کاڵا
                </Button>
                <ExcelImportButton form={form} />
                <TemplateDownloadButton />
            </div>
        </div>

        <div className="flex justify-end items-start gap-8 pt-6 border-t">
            <div className="space-y-2 text-left min-w-[280px]">
                <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <span className="text-muted-foreground">:کۆی کاڵاکان</span>
                    <span className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subTotal)}</span>
                </div>
                 <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <FormField
                        control={form.control}
                        name="customsFee"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between w-full">
                                <FormLabel className="text-muted-foreground">:گومرگ (USD)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} className="w-32" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-secondary/80">
                    <span className="font-bold">:کۆی گشتی (USD)</span>
                    <span className="font-bold text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</span>
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "...پاشەکەوت دەکرێت" : (formId ? "نوێکردنەوەی پسوولە" : "پاشەکەوتکردنی پسوولە")}
            </Button>
        </div>
      </form>
    </Form>
  );
}
