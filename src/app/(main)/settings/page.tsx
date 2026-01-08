
'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, updateDoc, addDoc, deleteDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

// User Management Component
type User = {
    username: string;
    role: 'Admin' | 'Data Manager' | 'Salesman';
};

function UserManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        if (!firestore) return;
        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, { role: newRole });
            toast({ title: "سەرکەوتوو بوو", description: "ڕۆڵی بەکارهێنەر نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
        } catch (error) {
            console.error("Error updating role: ", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوەی ڕۆڵ سەرکەوتوو نەبوو." });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>بەڕێوەبردنی بەکارهێنەران</CardTitle>
                <CardDescription>ڕۆڵ و دەسەڵاتی بەکارهێنەرانی سیستەم بگۆڕە.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ئیمەیڵ (ناوی بەکارهێنەر)</TableHead>
                            <TableHead className="text-right w-[200px]">ڕۆڵ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : users?.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium text-right">{user.username}</TableCell>
                                <TableCell>
                                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as User['role'])}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">بەڕێوەبەر</SelectItem>
                                            <SelectItem value="Data Manager">داتا مانجەر</SelectItem>
                                            <SelectItem value="Salesman">فرۆشیار</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Category Management Component
type Category = { name: string };
function CategoryManagement({ title, collectionName, placeholder }: { title: string, collectionName: string, placeholder: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [newCategory, setNewCategory] = useState('');
    
    const categoryQuery = useMemoFirebase(() => firestore ? collection(firestore, collectionName) : null, [firestore, collectionName]);
    const { data: categories, isLoading } = useCollection<Category>(categoryQuery);
    
    const handleAddCategory = async () => {
        if (!firestore || !newCategory.trim()) return;
        try {
            await addDoc(collection(firestore, collectionName), { name: newCategory });
            toast({ title: "سەرکەوتوو بوو", description: "پۆلی نوێ زیادکرا.", className: "bg-accent text-accent-foreground" });
            setNewCategory('');
        } catch (error) {
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "زیادکردنی پۆل سەرکەوتوو نەبوو." });
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, collectionName, id));
            toast({ title: "سەرکەوتوو بوو", description: "پۆلەکە سڕایەوە.", className: "bg-accent text-accent-foreground" });
        } catch (error) {
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەی پۆل سەرکەوتوو نەبوو." });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="flex gap-2 pt-4">
                    <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder={placeholder} />
                    <Button onClick={handleAddCategory}>زیادکردن</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader><TableRow><TableHead className="text-right">ناو</TableHead><TableHead className="text-left">کردار</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : categories?.map(cat => (
                            <TableRow key={cat.id}>
                                <TableCell className="font-medium text-right">{cat.name}</TableCell>
                                <TableCell className="text-left">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function DataManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const exportToExcel = async (collectionName: string, fileName: string) => {
        if (!firestore) return;
        toast({title: "...چاوەڕوانبە", description: `هەناردەکردنی داتای ${collectionName}`})

        const querySnapshot = await getDocs(collection(firestore, collectionName));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        
        toast({title: "سەرکەوتوو بوو", description: `داتای ${collectionName} بەسەرکەوتوویی هەناردەکرا.`})
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>بەڕێوەبردنی داتا</CardTitle>
                <CardDescription>هەناردەکردنی داتاکانی سیستەم بۆ فایلی ئێکسڵ.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => exportToExcel('selling_forms', 'فرۆشەکان')}>
                    <FileDown className="ml-2 h-4 w-4" />
                    هەناردەکردنی فرۆشەکان
                </Button>
                 <Button variant="outline" onClick={() => exportToExcel('buying_forms', 'کڕینەکان')}>
                    <FileDown className="ml-2 h-4 w-4" />
                    هەناردەکردنی کڕینەکان
                </Button>
                 <Button variant="outline" onClick={() => exportToExcel('expenses', 'خەرجییەکان')}>
                    <FileDown className="ml-2 h-4 w-4" />
                    هەناردەکردنی خەرجییەکان
                </Button>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="ڕێکخستنەکان" description="بەڕێوەبردنی بەکارهێنەران، پۆلەکان، و داتاکانی سیستەم." />
            
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users">بەکارهێنەران</TabsTrigger>
                    <TabsTrigger value="categories">پۆلەکان</TabsTrigger>
                    <TabsTrigger value="data">داتا</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-6">
                    <UserManagement />
                </TabsContent>
                <TabsContent value="categories" className="mt-6 space-y-6">
                    <CategoryManagement title="پۆلەکانی کاڵا" collectionName="product_categories" placeholder="ناوی پۆلی نوێی کاڵا" />
                    <CategoryManagement title="پۆلەکانی خەرجی" collectionName="expense_categories" placeholder="ناوی پۆلی نوێی خەرجی" />
                </TabsContent>
                <TabsContent value="data" className="mt-6">
                    <DataManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}

    