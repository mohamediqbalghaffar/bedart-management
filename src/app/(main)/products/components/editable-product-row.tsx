'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Loader2, Edit, Trash2, Save, X } from 'lucide-react';
import { useFirestore, doc, updateDoc, deleteDoc, writeBatch, collection, where, query, getDocs } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { WithId } from '@/firebase/firestore/use-collection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ProductDefinition } from '../page';
import { ProductCategory } from '@/lib/types';


const productSchema = z.object({
  productName: z.string().min(1, { message: "ناوی کاڵا پێویستە." }),
  category: z.enum(['Mattress', 'Bed', 'Pillow', 'Cover']),
  sellingPrice: z.coerce.number().min(0, "نرخ ناتوانێت سالب بێت."),
});

type ProductFormValues = z.infer<typeof productSchema>;

const productCategories: ProductCategory[] = ["Mattress", "Bed", "Pillow", "Cover"];
const categoryTranslations: Record<ProductCategory, string> = {
  Mattress: "دۆشەک",
  Bed: "تەخت",
  Pillow: "سەرین",
  Cover: "بەرگ",
};

export function EditableProductRow({ product, onProductUpdated }: { product: WithId<ProductDefinition>, onProductUpdated: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: product,
    });

    const handleSave = async (data: ProductFormValues) => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            // Update the definition itself
            const definitionRef = doc(firestore, "product_definitions", product.id);
            await updateDoc(definitionRef, data);

            // Also update all related stock items in the `products` collection
            const stockQuery = query(collection(firestore, 'products'), where('productName', '==', product.productName));
            const stockSnap = await getDocs(stockQuery);
            
            if(!stockSnap.empty) {
                const batch = writeBatch(firestore);
                stockSnap.forEach(stockDoc => {
                    batch.update(stockDoc.ref, { 
                        category: data.category, 
                        sellingPrice: data.sellingPrice 
                    });
                });
                await batch.commit();
            }

            toast({ title: "سەرکەوتوو بوو", description: "پێناسەی کاڵا و هەموو دانەکانی کۆگا نوێکرانەوە.", className: "bg-accent text-accent-foreground" });
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
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    if (isEditing) {
        return (
            <Form {...form}>
                <TableRow className="bg-secondary/20">
                    <TableCell><FormField control={form.control} name="productName" render={({ field }) => (<FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
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
                    <TableCell><FormField control={form.control} name="sellingPrice" render={({ field }) => (<FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)}/></TableCell>
                    <TableCell className="text-left">
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={form.handleSubmit(handleSave)} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 text-primary"/>}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-4 w-4 text-muted-foreground"/></Button>
                        </div>
                    </TableCell>
                </TableRow>
            </Form>
        );
    }

    return (
        <TableRow key={product.id}>
            <TableCell className="font-medium text-right">{product.productName}</TableCell>
            <TableCell className="text-right">{categoryTranslations[product.category] || product.category}</TableCell>
            <TableCell className="text-right">{currencyFormatter.format(product.sellingPrice || 0)}</TableCell>
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
        </TableRow>
    );
}
