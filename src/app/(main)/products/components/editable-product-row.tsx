'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit, Trash2, Save, X } from 'lucide-react';
import { useFirestore, doc, updateDoc, deleteDoc, writeBatch, collection, where, query, getDocs } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { WithId } from '@/firebase/firestore/use-collection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { ProductDefinition } from '../page';
import { ProductCategory } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';


const productSchema = z.object({
  productName: z.string().min(1, { message: "ناوی کاڵا پێویستە." }),
  category: z.enum(['Mattress', 'Bed', 'Pillow', 'Cover']),
  maxDiscountPercent: z.coerce.number().min(0, "ناتوانێت کەمتر بێت لە 0").max(100, "ناتوانێت زیاتر بێت لە 100").optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];
const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};

export function EditableProductRow({ product, onProductUpdated, isSelected, onSelectionChange, mode = 'table' }: { product: WithId<ProductDefinition>, onProductUpdated: () => void, isSelected: boolean, onSelectionChange: (id: string, checked: boolean) => void, mode?: 'table' | 'card' }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const { user } = useAuth();
    const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Data Manager';
    const [editingDiscount, setEditingDiscount] = useState(false);
    const [discountValue, setDiscountValue] = useState(product.maxDiscountPercent ?? 10);
    const [isSavingDiscount, setIsSavingDiscount] = useState(false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productName: product.productName,
            category: product.category,
            maxDiscountPercent: product.maxDiscountPercent ?? 10,
        },
    });

    const handleSave = async (data: ProductFormValues) => {
        if (!firestore) return;
        setIsSaving(true);
        const oldProductName = product.productName;
        const newProductName = data.productName;

        try {
            const batch = writeBatch(firestore);

            // Update the definition itself
            const definitionRef = doc(firestore, "product_definitions", product.id);
            batch.update(definitionRef, data);

            // If product name or category changed, update all related stock items
            if (oldProductName !== newProductName || product.category !== data.category) {
                const stockQuery = query(collection(firestore, 'products'), where('productName', '==', oldProductName));
                const stockSnap = await getDocs(stockQuery);
                stockSnap.forEach(stockDoc => {
                    batch.update(stockDoc.ref, { 
                        productName: newProductName,
                        category: data.category,
                    });
                });
            }

            await batch.commit();

            if (data.maxDiscountPercent !== undefined) {
                setDiscountValue(data.maxDiscountPercent);
            }

            toast({ title: "سەرکەوتوو بوو", description: "پێناسەی کاڵا نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
            setIsEditing(false);
            onProductUpdated();
        } catch (error) {
            console.error("Error updating product:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوەکە سەرکەوتوو نەبوو." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "product_definitions", product.id));
            toast({ title: "سەرکەوتوو بوو", description: "پێناسەی کاڵا سڕایەوە.", className: "bg-accent text-accent-foreground" });
            onProductUpdated();
        } catch (error) {
            console.error("Error deleting product definition:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەکە سەرکەوتوو نەبوو." });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleSaveDiscount = async (newValue: number) => {
        if (!firestore) return;
        setIsSavingDiscount(true);
        try {
            const clampedValue = Math.min(100, Math.max(0, newValue));
            await updateDoc(doc(firestore, 'product_definitions', product.id), { maxDiscountPercent: clampedValue });
            setDiscountValue(clampedValue);
            toast({ title: 'سەرکەوتوو بوو', description: `حدی داشکاندن بۆ ${clampedValue}% گۆڕدرا.`, className: 'bg-accent text-accent-foreground' });
            setEditingDiscount(false);
            onProductUpdated();
        } catch (error) {
            console.error('Error updating discount limit:', error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'گۆڕینی حدی داشکاندن سەرکەوتوو نەبوو.' });
        } finally {
            setIsSavingDiscount(false);
        }
    };
    
    if (isEditing) {
        if (mode === 'card') {
            return (
                <Card className="md:hidden">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                            <CardContent className="pt-6 space-y-4">
                                 <FormField control={form.control} name="productName" render={({ field }) => ( <FormItem> <FormLabel>ناوی کاڵا</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>پۆل</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>{productCategories.map(cat => <SelectItem key={cat} value={cat}>{categoryTranslations[cat]}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                {isAdminOrManager && (
                                    <FormField control={form.control} name="maxDiscountPercent" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>حدی داشکاندن %</FormLabel>
                                            <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                 <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 mr-2 text-muted-foreground"/>پاشگەزبوونەوە</Button>
                                 <Button size="sm" onClick={form.handleSubmit(handleSave)} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2 text-primary-foreground"/>}
                                    پاشەکەوت
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            );
        }

        return (
            <Form {...form}>
                <TableRow className="bg-secondary/20 hidden md:table-row">
                     <TableCell>
                        <FormField control={form.control} name="productName" render={({ field }) => (
                            <FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </TableCell>
                    <TableCell>
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{productCategories.map(cat => <SelectItem key={cat} value={cat}>{categoryTranslations[cat]}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </TableCell>
                    <TableCell className="text-center">
                        {isAdminOrManager ? (
                            <FormField control={form.control} name="maxDiscountPercent" render={({ field }) => (
                                <FormItem><FormControl><Input type="number" min={0} max={100} {...field} className="text-center w-20 mx-auto" /></FormControl><FormMessage /></FormItem>
                            )}/>
                        ) : (
                            <span className="text-sm">{discountValue}%</span>
                        )}
                    </TableCell>
                    <TableCell className="text-left">
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={form.handleSubmit(handleSave)} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 text-primary"/>}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 text-muted-foreground"/></Button>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(product.id, !!checked)} disabled />
                    </TableCell>
                </TableRow>
            </Form>
        );
    }

    if (mode === 'card') {
        return (
            <Card key={`${product.id}-mobile`} className="md:hidden">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle>{product.productName}</CardTitle>
                            <CardDescription>{categoryTranslations[product.category] || product.category}</CardDescription>
                            <span className="text-xs text-muted-foreground">حدی داشکاندن: {discountValue}%</span>
                        </div>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectionChange(product.id, !!checked)}
                            className="mt-1"
                        />
                    </div>
                </CardHeader>
                <CardFooter className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2 text-blue-500"/>دەستکاری</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 mr-2 text-destructive" />سڕینەوە</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>ئایا دڵنیایت لە سڕینەوەی پێناسەی ئەم کاڵایە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە. ئەمە کاریگەری لەسەر دانەکانی ناو کۆگا نابێت، بەڵام پێناسە سەرەکییەکە دەسڕێتەوە.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">بەڵێ, بسڕەوە</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        );
    }

    return (
        <TableRow key={product.id} className="hidden md:table-row">
            <TableCell className="font-medium text-right">{product.productName}</TableCell>
            <TableCell className="text-right">{categoryTranslations[product.category] || product.category}</TableCell>
            <TableCell className="text-center">
                {isAdminOrManager ? (
                    editingDiscount ? (
                        <div className="flex items-center justify-center gap-1">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                className="w-16 h-7 text-center text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveDiscount(discountValue);
                                    if (e.key === 'Escape') setEditingDiscount(false);
                                }}
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveDiscount(discountValue)} disabled={isSavingDiscount}>
                                {isSavingDiscount ? <Loader2 className="h-3 w-3 animate-spin"/> : <Save className="h-3 w-3 text-primary"/>}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingDiscount(false); setDiscountValue(product.maxDiscountPercent ?? 10); }}>
                                <X className="h-3 w-3 text-muted-foreground"/>
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-sm font-medium" onClick={() => setEditingDiscount(true)}>
                            {discountValue}%
                        </Button>
                    )
                ) : (
                    <span className="text-sm">{discountValue}%</span>
                )}
            </TableCell>
            <TableCell className="text-left">
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 text-blue-500"/></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>ئایا دڵنیایت لە سڕینەوەی پێناسەی ئەم کاڵایە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە. ئەمە کاریگەری لەسەر دانەکانی ناو کۆگا نابێت، بەڵام پێناسە سەرەکییەکە دەسڕێتەوە.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">بەڵێ, بسڕەوە</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
            <TableCell>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange(product.id, !!checked)}
                />
            </TableCell>
        </TableRow>
    );
}
