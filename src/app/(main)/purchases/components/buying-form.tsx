"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, UseFormReturn, Control } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle, Trash2, List, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, setDoc, getDoc, runTransaction, getDocs, deleteDoc, DocumentReference } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { WithId } from "@/firebase/firestore/use-collection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductSelectorDialog } from "../../components/product-selector-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { DocumentData, DocumentReference } from "firebase/firestore";
import { ProductCategory } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ── Stable, Unicode-safe product document ID generator ────────────────────────
// The old approach used /[^a-z0-9]/g which stripped all Kurdish/Arabic chars,
// producing identical IDs for every Kurdish-named product. This version uses
// encodeURIComponent + base64 to create a collision-free, URL-safe ID.
function makeProductId(productName: string, sizeModel: string | undefined | null, stockLocation: string): string {
  const key = `${productName.trim()}||${(sizeModel || '').trim()}||${stockLocation}`;
  try {
    // btoa needs a binary string — encodeURIComponent handles unicode, unescape converts back
    const b64 = btoa(unescape(encodeURIComponent(key)));
    // Make it URL-safe and trim to 80 chars (Firestore doc ID max is 1500 bytes)
    return b64.replace(/[+/=]/g, '_').slice(0, 80);
  } catch {
    // Fallback: simple sanitise keeping arabic/kurdish unicode range
    return key.replace(/[^\w\u0600-\u06FF\u0660-\u0669-]/g, '_').slice(0, 80);
  }
}
import { ConfidentialBlur } from "@/components/shared/confidential-blur";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


// Define types based on your Firestore structure
type Supplier = {
  id: string;
  supplierName: string;
};

type ProductDefinition = {
    productName: string;
    sellingPrice?: number;
    category: ProductCategory;
}

const buyingFormSchema = z.object({
  supplierId: z.string().min(1, "هەڵبژاردنی دابینکەر پێویستە."),
  issueDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "فۆرماتی بەروار هەڵەیە (YYYY-MM-DD)." }),
  items: z.array(z.object({
    product: z.string().min(1, "ناوی کاڵا پێویستە."),
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
    initialItems?: any[];
};

function BuyingFormItemRow({
    form,
    index,
    remove,
    fieldId,
    productDefinitions,
    mode = 'table'
}: {
    form: UseFormReturn<BuyingFormValues>;
    index: number;
    remove: (index: number) => void;
    fieldId: string;
    productDefinitions: WithId<ProductDefinition>[] | null;
    mode?: 'table' | 'card';
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [suggestion, setSuggestion] = useState<WithId<ProductDefinition> | null>(null);
    const [showSuggestion, setShowSuggestion] = useState(false);
    
    const watchedItem = form.watch(`items.${index}`);
    const debouncedProductName = useDebounce(watchedItem.product, 500);

    useEffect(() => {
        if (debouncedProductName && productDefinitions) {
            const exactMatch = productDefinitions.find(p => p.productName.toLowerCase() === debouncedProductName.toLowerCase());

            if (exactMatch) {
                form.setValue(`items.${index}.sellingPrice`, exactMatch.sellingPrice || 0);
                form.setValue(`items.${index}.category`, exactMatch.category);
                setSuggestion(null);
                setShowSuggestion(false);
            } else {
                let bestMatch: WithId<ProductDefinition> | undefined;
                let longestMatchLength = 0;

                for (const def of productDefinitions) {
                    if (debouncedProductName.toLowerCase().includes(def.productName.toLowerCase())) {
                        if (def.productName.length > longestMatchLength) {
                            bestMatch = def;
                            longestMatchLength = def.productName.length;
                        }
                    }
                }

                if (bestMatch) {
                    setSuggestion(bestMatch);
                    setShowSuggestion(true);
                } else {
                    setSuggestion(null);
                    setShowSuggestion(false);
                }
            }
        } else {
            setSuggestion(null);
            setShowSuggestion(false);
        }
    }, [debouncedProductName, productDefinitions, form, index]);
    
    const handleSuggestionSelect = () => {
        if (suggestion) {
            form.setValue(`items.${index}.product`, suggestion.productName);
            form.setValue(`items.${index}.category`, suggestion.category);
            setShowSuggestion(false);
            setSuggestion(null);
        }
    };

    if (mode === 'card') {
        return (
            <Card className="md:hidden" key={fieldId}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                         <CardTitle>کاڵای #{index + 1}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name={`items.${index}.product`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ناوی کاڵا</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <div className="relative w-full">
                                            <Input placeholder="ناوی کاڵا..." {...field} />
                                            {showSuggestion && suggestion && (
                                                 <Popover open={showSuggestion} onOpenChange={setShowSuggestion}>
                                                    <PopoverTrigger asChild><span className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer"><AlertTriangle className="h-5 w-5 text-yellow-500" /></span></PopoverTrigger>
                                                    <PopoverContent className="w-auto p-2" align="start"><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">وات لێ بوو:</span><Button variant="ghost" size="sm" onClick={handleSuggestionSelect} className="text-primary hover:text-primary">{suggestion.productName}؟</Button></div></PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </FormControl>
                                     <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                        <DialogTrigger asChild><Button variant="outline" size="icon"><List className="h-4 w-4" /></Button></DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl" dir="rtl"><DialogHeader><DialogTitle>لیستی کاڵاکان</DialogTitle></DialogHeader>
                                            <ProductSelectorDialog onProductSelect={({ name, price, purchasePrice, category }) => {
                                                form.setValue(`items.${index}.product`, name);
                                                form.setValue(`items.${index}.sellingPrice`, price);
                                                form.setValue(`items.${index}.unitPrice`, purchasePrice || 0);
                                                form.setValue(`items.${index}.category`, category);
                                                setDialogOpen(false);
                                            }} filterByStock={false} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name={`items.${index}.category`} render={({ field }) => (
                            <FormItem>
                                <FormLabel>پۆل</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="Mattress">دۆشەک</SelectItem><SelectItem value="Bed">تەخت</SelectItem><SelectItem value="Pillow">سەرین</SelectItem><SelectItem value="Cover">بەرگ</SelectItem></SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormLabel>دانە</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (<FormItem><FormLabel>نرخی کڕین</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name={`items.${index}.sellingPrice`} render={({ field }) => (<FormItem><FormLabel>نرخی فرۆشتن</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                    <span className="text-muted-foreground">نرخی کۆ:</span>
                    <ConfidentialBlur><span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(watchedItem?.quantity * watchedItem?.unitPrice || 0)}</span></ConfidentialBlur>
                </CardFooter>
            </Card>
        );
    }

    return (
        <TableRow key={fieldId} className="hidden md:table-row">
            <TableCell className="align-top">
                <FormField
                    control={form.control}
                    name={`items.${index}.product`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <div className="relative w-full">
                                        <Input placeholder="ناوی کاڵا..." {...field} />
                                        {showSuggestion && suggestion && (
                                            <Popover open={showSuggestion} onOpenChange={setShowSuggestion}>
                                                <PopoverTrigger asChild>
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer">
                                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                                    </span>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-2" align="start">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">وات لێ بوو:</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={handleSuggestionSelect}
                                                            className="text-primary hover:text-primary"
                                                        >
                                                            {suggestion.productName}؟
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </div>
                                </FormControl>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon"><List className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-3xl" dir="rtl">
                                        <DialogHeader>
                                            <DialogTitle>لیستی کاڵاکان</DialogTitle>
                                        </DialogHeader>
                                        <ProductSelectorDialog onProductSelect={({ name, price, purchasePrice, category }) => {
                                            form.setValue(`items.${index}.product`, name);
                                            form.setValue(`items.${index}.sellingPrice`, price);
                                            form.setValue(`items.${index}.unitPrice`, purchasePrice || 0);
                                            form.setValue(`items.${index}.category`, category);
                                            setDialogOpen(false);
                                        }} filterByStock={false} />
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
            <TableCell className="align-top pt-5 font-semibold text-left">
                <ConfidentialBlur>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(watchedItem?.quantity * watchedItem?.unitPrice || 0)}</ConfidentialBlur>
            </TableCell>
            <TableCell className="align-top text-left">
                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

export function BuyingForm({ onSave, formId, initialItems }: BuyingFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [originalItems, setOriginalItems] = useState<any[]>([]);

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suppliers');
  }, [firestore]);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersQuery);
  
  const productDefsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'product_definitions');
  }, [firestore]);
  const { data: productDefinitions } = useCollection<ProductDefinition>(productDefsQuery);

  const form = useForm<BuyingFormValues>({
    resolver: zodResolver(buyingFormSchema),
    defaultValues: {
      supplierId: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      items: initialItems || [{ product: "", quantity: 1, unitPrice: 0, sellingPrice: 0, category: "Mattress", sizeModel: "" }],
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
            
            const itemsRef = collection(firestore, `buying_forms/${formId}/buying_form_products`);
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
            const productDocsToRead = new Map<string, DocumentReference<DocumentData>>();

            // Phase 1: Determine all documents to read
            if (formId) {
                originalItems.forEach(item => {
                    const productId = item.productId;
                    if(productId) {
                        productDocsToRead.set(productId, doc(firestore, 'products', productId));
                    }
                });
            }
            data.items.forEach(item => {
                const productId = makeProductId(item.product, item.sizeModel, data.stockLocation);
                productDocsToRead.set(productId, doc(firestore, 'products', productId));
            });

            // Phase 2: Read all documents
            const productSnapshots = await Promise.all(
                Array.from(productDocsToRead.values()).map(ref => transaction.get(ref))
            );
            const productDataMap = new Map(productSnapshots.map(snap => [snap.id, snap]));

            // Phase 3: Calculate changes (no reads/writes)
            const stockAdjustments = new Map<string, number>();

            if (formId) {
                originalItems.forEach(item => {
                     const productId = item.productId;
                     if(productId) {
                        stockAdjustments.set(productId, (stockAdjustments.get(productId) || 0) - item.quantity);
                     }
                });
            }

            data.items.forEach(item => {
                const productId = makeProductId(item.product, item.sizeModel, data.stockLocation);
                stockAdjustments.set(productId, (stockAdjustments.get(productId) || 0) + item.quantity);
            });

            // Phase 4: Write all changes
            for (const [productId, quantityChange] of stockAdjustments.entries()) {
                const productRef = doc(firestore, 'products', productId);
                const productDoc = productDataMap.get(productId);
                const formItemData = data.items.find(i => `${i.product.toLowerCase().replace(/[^\u0600-\u06FFa-z0-9]/g, '-')}-${data.stockLocation.toLowerCase().replace(/\s/g, '')}` === productId);

                if (productDoc && productDoc.exists()) {
                    const currentQuantity = (productDoc.data() as any)?.currentQuantity || 0;
                    const newQuantity = currentQuantity + quantityChange;
                    transaction.update(productRef, { 
                        currentQuantity: newQuantity,
                         ...(formItemData && {
                            supplierId: data.supplierId, 
                            unitPrice: formItemData.unitPrice,
                            sellingPrice: formItemData.sellingPrice,
                         })
                    });
                } else if (formItemData) {
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

            const { items, ...mainData } = data;
            const finalTotalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) + Number(mainData.customsFee || 0);
            const buyingFormData = { ...mainData, id: buyingFormId, totalAmount: finalTotalAmount };
            transaction.set(buyingFormRef, buyingFormData, { merge: true });
            
            // Delete old items and add new ones (this is okay as it's not interleaved with reads from the same documents)
            if (formId) {
                 const existingItemsSnap = await getDocs(collection(firestore, `buying_forms/${formId}/buying_form_products`));
                 existingItemsSnap.forEach(doc => transaction.delete(doc.ref));
            }

            items.forEach(item => {
                const productSubCollectionRef = doc(collection(firestore, `buying_forms/${buyingFormId}/buying_form_products`));
                const productDocId = makeProductId(item.product, item.sizeModel, data.stockLocation);

                const productData = {
                    id: productSubCollectionRef.id,
                    buyingFormId: buyingFormId,
                    productId: productDocId,
                    productName: item.product,
                    category: item.category,
                    sizeModel: item.sizeModel || '',
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
        <div className="flex flex-col md:flex-row justify-between items-start p-1 border-b pb-4 gap-4">
             <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                        <FormLabel className="mt-2">بەروار:</FormLabel>
                        <FormControl>
                            <DatePicker value={field.value} onChange={field.onChange} className="w-[180px]" />
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
            {/* Desktop Table */}
            <Table className="hidden md:table">
                <TableHeader>
                    <TableRow className="bg-primary/90 hover:bg-primary">
                        <TableHead className="w-2/5 text-primary-foreground text-center">کاڵا</TableHead>
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
                            productDefinitions={productDefinitions}
                            mode="table"
                        />
                    ))}
                </TableBody>
            </Table>
            {/* Mobile Cards */}
             <div className="space-y-4 md:hidden">
                {fields.map((field, index) => (
                    <BuyingFormItemRow
                        key={field.id}
                        fieldId={field.id}
                        form={form}
                        index={index}
                        remove={() => fields.length > 1 && remove(index)}
                        productDefinitions={productDefinitions}
                        mode="card"
                    />
                ))}
            </div>
            <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product: "", quantity: 1, unitPrice: 0, sellingPrice: 0, category: 'Mattress', sizeModel: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    زیادکردنی کاڵا
                </Button>
            </div>
        </div>

        <div className="flex justify-center md:justify-end items-start gap-8 pt-6 border-t">
            <div className="space-y-2 text-left w-full md:w-auto md:min-w-[280px]">
                <div className="flex items-center justify-between gap-4 p-2 rounded-md">
                    <span className="text-muted-foreground">:کۆی کاڵاکان</span>
                    <ConfidentialBlur><span className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subTotal)}</span></ConfidentialBlur>
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
                    <ConfidentialBlur><span className="font-bold text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</span></ConfidentialBlur>
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
