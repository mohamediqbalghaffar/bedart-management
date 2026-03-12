'use client';

import React, { use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddSupplierForm } from "./components/add-supplier-form";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

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

    const { data: suppliers, isLoading } = useCollection<WithId<Supplier>>(suppliersQuery);

    return (
         <Card>
            <CardHeader>
                <CardTitle>لیستی دابینکەران</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    {/* Desktop View */}
                    <Table className="hidden md:table">
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
                    {/* Mobile View */}
                     <div className="md:hidden space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                        ) : suppliers && suppliers.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">هیچ دابینکەرێک تۆمار نەکراوە.</div>
                        ) : (
                            suppliers?.map((supplier) => (
                                <Card key={supplier.id} className="bg-card/80">
                                    <CardHeader>
                                        <CardTitle>{supplier.supplierName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4 mt-1 flex-shrink-0" />
                                            <p className="whitespace-pre-wrap">{supplier.contactInformation || 'زانیاری پەیوەندی نییە'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function SuppliersPage(props: any) {
    React.use(props.params);
    React.use(props.searchParams);
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی دابینکەران" description="لیستی دابینکەرەکانت لێرە ببینە و زیاد بکە.">
                <AddSupplierDialog />
            </PageHeader>
            <SuppliersList />
        </div>
    );
}
