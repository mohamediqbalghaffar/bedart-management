'use client';

import React, { use, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2, Phone, MapPin, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddCustomerForm } from "./components/add-customer-form";
import { useFirestore, useCollection, useMemoFirebase, collection, deleteDoc, doc, getDocs, query, where } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WithId } from '@/firebase/firestore/use-collection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type Customer = {
    customerName: string;
    customerPhoneNumber?: string;
    customerAddress?: string;
};

function AddCustomerDialog() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle />
                    زیادکردنی کڕیار
                </Button>
            </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>کڕیاری نوێ زیاد بکە</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی کڕیاری نوێ بنووسە. 
                     </DialogDescription>
                </DialogHeader>
                <AddCustomerForm onCustomerAdded={() => setIsDialogOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function CustomersList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingCustomer, setEditingCustomer] = useState<WithId<Customer> | null>(null);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'customers');
    }, [firestore]);

    const { data: customers, isLoading } = useCollection<WithId<Customer>>(customersQuery);

    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete(customerId: string, customerName: string) {
        if (!firestore) return;
        setIsDeleting(true);

        try {
            // D-05: Check referential integrity — block if customer has sales
            const salesRef = collection(firestore, 'selling_forms');
            const salesQuery = query(salesRef, where('customerName', '==', customerName));
            const salesSnapshot = await getDocs(salesQuery);

            if (!salesSnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "ناتوانرێت بسڕدرێتەوە",
                    description: "ئەم کڕیارە لە فۆڕمی فرۆشتندا بەکارهاتووە و ناتوانرێت بسڕدرێتەوە.",
                });
                return;
            }

            await deleteDoc(doc(firestore, "customers", customerId));
            toast({
                title: "سەرکەوتوو بوو!",
                description: "کڕیارەکە بە سەرکەوتوویی سڕایەوە.",
                className: "bg-accent text-accent-foreground",
            });
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast({
                variant: "destructive",
                title: "هەڵەیەک ڕوویدا",
                description: "سڕینەوەی کڕیار سەرکەوتوو نەبوو.",
            });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>لیستی کڕیارەکان</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Table className="hidden md:table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">ناوی کڕیار</TableHead>
                                    <TableHead className="text-right">ژمارەی تەلەفۆن</TableHead>
                                    <TableHead className="text-right">ناونیشان</TableHead>
                                    <TableHead className="text-center">کردارەکان</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : customers && customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">هیچ کڕیارێک تۆمار نەکراوە.</TableCell>
                                    </TableRow>
                                ) : (
                                    customers?.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium text-right">{customer.customerName}</TableCell>
                                            <TableCell className="text-right">{customer.customerPhoneNumber || 'نەزانراو'}</TableCell>
                                            <TableCell className="text-right">{customer.customerAddress || 'نەزانراو'}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(customer)}>
                                                        <Edit className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent dir="rtl">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم کڕیارە؟</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    ئەم کردارە پاشگەزبوونەوەی نییە و هەموو زانیارییەکانی ئەم کڕیارە دەسڕێتەوە.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(customer.id, customer.customerName)} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>{isDeleting ? "دەسڕدرێتەوە..." : "بەڵێ، بسڕەوە"}</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="md:hidden space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                            ) : customers && customers.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">هیچ کڕیارێک تۆمار نەکراوە.</div>
                            ) : (
                                customers?.map((customer) => (
                                    <Card key={customer.id} className="bg-card/80">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-base font-bold">{customer.customerName}</CardTitle>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer(customer)}>
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent dir="rtl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>دڵنیایت؟</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                ئەم کڕیارە دەسڕێتەوە.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>نەخێر</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(customer.id, customer.customerName)} className="bg-destructive" disabled={isDeleting}>{isDeleting ? "دەسڕدرێتەوە..." : "بەڵێ"}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{customer.customerPhoneNumber || 'ژمارە تەلەفۆن نییە'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>{customer.customerAddress || 'ناونیشان نییە'}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>دەستکاریکردنی زانیارییەکانی کڕیار</DialogTitle>
                        <DialogDescription>
                            زانیارییەکان بگۆڕە و پاشەکەوتی بکە.
                        </DialogDescription>
                    </DialogHeader>
                    {editingCustomer && (
                        <AddCustomerForm 
                            customerId={editingCustomer.id}
                            initialData={{
                                customerName: editingCustomer.customerName,
                                customerPhoneNumber: editingCustomer.customerPhoneNumber || "",
                                customerAddress: editingCustomer.customerAddress || "",
                            }}
                            onCustomerAdded={() => setEditingCustomer(null)} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function CustomersPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="بەڕێوەبردنی کڕیارەکان" description="لیستی کڕیارەکانت لێرە ببینە و زیاد بکە.">
                <AddCustomerDialog />
            </PageHeader>
            <CustomersList />
        </div>
    );
}