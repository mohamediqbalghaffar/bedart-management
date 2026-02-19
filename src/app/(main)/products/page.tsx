'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddProductForm } from './components/add-product-form';
import { EditableProductRow } from './components/editable-product-row';

export type ProductDefinition = {
    productName: string;
    category: 'Mattress' | 'Bed' | 'Pillow' | 'Cover';
    sellingPrice: number;
};

function AddProductDialog({ onProductAdded }: { onProductAdded: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle />
                    زیادکردنی کاڵای نوێ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>کاڵای نوێ زیاد بکە</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی کاڵا بنووسە بۆ دروستکردنی پێناسەیەکی نوێ.
                    </DialogDescription>
                </DialogHeader>
                <AddProductForm onProductAdded={() => {
                    onProductAdded();
                    setOpen(false);
                }} />
            </DialogContent>
        </Dialog>
    );
}

function ProductDefinitionsList() {
    const firestore = useFirestore();
    const [refreshKey, setRefreshKey] = useState(0);

    const definitionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'product_definitions');
    }, [firestore, refreshKey]);

    const { data: products, isLoading } = useCollection<ProductDefinition>(definitionsQuery);

    const handleProductChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>لیستی پێناسەی کاڵاکان</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ناوی کاڵا</TableHead>
                            <TableHead className="text-right">پۆل</TableHead>
                            <TableHead className="text-right">نرخی فرۆشتن</TableHead>
                            <TableHead className="text-left">کردارەکان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : !products || products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">هیچ پێناسەیەکی کاڵا تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <EditableProductRow key={product.id} product={product} onProductUpdated={handleProductChange} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function ProductsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleSave = () => setRefreshKey(prev => prev + 1);

    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی ناوی کاڵاکان" description="پێناسەی کاڵا سەرەکییەکانت لێرە ببینە و زیاد بکە.">
                <AddProductDialog onProductAdded={handleSave} />
            </PageHeader>
            <ProductDefinitionsList />
        </div>
    );
}
