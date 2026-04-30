'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, Phone, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SupplierForm } from "./components/supplier-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
                <SupplierForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function EditSupplierDialog({ supplier }: { supplier: WithId<Supplier> }) {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>دەستکاریکردنی دابینکەر</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی دابینکەر نوێ بکەرەوە.
                    </DialogDescription>
                </DialogHeader>
                <SupplierForm 
                    supplierId={supplier.id}
                    initialData={{
                        supplierName: supplier.supplierName,
                        contactInformation: supplier.contactInformation || ""
                    }}
                    onSuccess={() => setIsDialogOpen(false)} 
                />
            </DialogContent>
        </Dialog>
    );
}

function DeleteSupplierDialog({ supplierId, supplierName }: { supplierId: string, supplierName: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState(false);

    async function handleDelete() {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "suppliers", supplierId));
            toast({
                title: "سەرکەوتوو بوو",
                description: "دابینکەر بە سەرکەوتوویی سڕایەوە.",
            });
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast({
                variant: "destructive",
                title: "هەڵەیەک ڕوویدا",
                description: "نەتوانرا دابینکەر بسڕدرێتەوە.",
            });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                    <AlertDialogTitle>ئایا دڵنیایت لە سڕینەوە؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        تۆ دەتەوێت دابینکەری "{supplierName}" بسڕیتەوە. ئەم کردارە ناگەڕێتەوە.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>پەشیمانبوونەوە</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                    >
                        {isDeleting ? "دەسڕدرێتەوە..." : "بسڕەوە"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
                                <TableHead className="text-left">کردارەکان</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : !suppliers || suppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">هیچ دابینکەرێک تۆمار نەکراوە.</TableCell>
                                </TableRow>
                            ) : (
                                suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium text-right">{supplier.supplierName}</TableCell>
                                    <TableCell className="text-right" style={{ whiteSpace: 'pre-wrap' }}>{supplier.contactInformation || 'نەزانراو'}</TableCell>
                                    <TableCell className="text-left">
                                        <div className="flex items-center gap-1">
                                            <EditSupplierDialog supplier={supplier} />
                                            <DeleteSupplierDialog supplierId={supplier.id} supplierName={supplier.supplierName} />
                                        </div>
                                    </TableCell>
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
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-bold">{supplier.supplierName}</CardTitle>
                                        <div className="flex items-center gap-1">
                                            <EditSupplierDialog supplier={supplier} />
                                            <DeleteSupplierDialog supplierId={supplier.id} supplierName={supplier.supplierName} />
                                        </div>
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
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی دابینکەران" description="لیستی دابینکەرەکانت لێرە ببینە و زیاد بکە.">
                <AddSupplierDialog />
            </PageHeader>
            <SuppliersList />
        </div>
    );
}

