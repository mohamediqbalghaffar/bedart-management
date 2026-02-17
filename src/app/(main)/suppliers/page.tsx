
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddSupplierForm } from "./components/add-supplier-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Supplier = {
    supplierName: string;
    contactInformation?: string;
};

function AddSupplierDialog() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle />
                    زیادکردنی دابینکەر
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>دابینکەری نوێ زیاد بکە</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی دابینکەری نوێ بنووسە بۆ زیادکردنی بۆ سیستەم.
                    </DialogDescription>
                </DialogHeader>
                <AddSupplierForm onSupplierAdded={() => setIsDialogOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function SuppliersList() {
    const firestore = useFirestore();

    const suppliersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'suppliers');
    }, [firestore]);

    const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersQuery);

    return (
         <Card>
            <CardHeader>
                <CardTitle>لیستی دابینکەران</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ناوی دابینکەر</TableHead>
                            <TableHead className="text-right">زانیاری پەیوەندی</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : !suppliers || suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">هیچ دابینکەرێک تۆمار نەکراوە.</TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium text-right">{supplier.supplierName}</TableCell>
                                <TableCell className="text-right" style={{ whiteSpace: 'pre-wrap' }}>{supplier.contactInformation || 'نەزانراو'}</TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function SuppliersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی دابینکەران" description="لیستی دابینکەرەکانت لێرە ببینە و زیاد بکە.">
                <AddSupplierDialog />
            </PageHeader>
            <SuppliersList />
        </div>
    );
}

    