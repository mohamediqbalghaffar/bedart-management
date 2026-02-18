'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, updateDoc, addDoc, deleteDoc, getDocs, writeBatch, getDoc, setDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, FileDown, AlertTriangle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddUserForm } from './components/add-user-form';
import { DialogContent } from '@radix-ui/react-dialog';

// General Settings Component
type CompanyInfo = {
    name: string;
    contact: string;
}
function GeneralSettings() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: '', contact: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const infoRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'companyInfo') : null, [firestore]);

    React.useEffect(() => {
        async function fetchInfo() {
            if (infoRef) {
                const docSnap = await getDoc(infoRef);
                if (docSnap.exists()) {
                    setCompanyInfo(docSnap.data() as CompanyInfo);
                }
                setIsLoading(false);
            }
        }
        fetchInfo();
    }, [infoRef]);

    const handleSave = async () => {
        if (!infoRef) return;
        setIsSaving(true);
        try {
            await setDoc(infoRef, companyInfo, { merge: true });
            toast({ title: "سەرکەوتوو بوو", description: "زانیارییەکان پاشەکەوتکران.", className: "bg-accent text-accent-foreground" });
        } catch (error) {
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "پاشەکەوتکردن سەرکەوتوو نەبوو." });
        } finally {
            setIsSaving(false);
        }
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>زانیاری گشتی کۆمپانیا</CardTitle>
                <CardDescription>ئەم زانیاریانە لەسەر پسوولە و ڕاپۆرتەکان بەکاردەهێنرێن.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="companyName">ناوی کۆمپانیا</label>
                    <Input id="companyName" value={companyInfo.name} onChange={(e) => setCompanyInfo(p => ({...p, name: e.target.value}))} placeholder="BedArt Group" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="companyContact">زانیاری پەیوەندی</label>
                    <Textarea id="companyContact" value={companyInfo.contact} onChange={(e) => setCompanyInfo(p => ({...p, contact: e.target.value}))} placeholder="ژ. تەلەفۆن, ناونیشان, هتد" />
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    پاشەکەوتکردن
                </Button>
            </CardFooter>
        </Card>
    );
}

// Add User Dialog
function AddUserDialog({ onUserAdded }: { onUserAdded: () => void }) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    زیادکردنی بەکارهێنەر
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>بەکارهێنەری نوێ</DialogTitle>
                    <DialogDescription>
                        زانیارییەکانی بەکارهێنەری نوێ بنووسە.
                    </DialogDescription>
                </DialogHeader>
                <AddUserForm onUserAdded={() => {
                    onUserAdded();
                    setOpen(false);
                }} />
            </DialogContent>
        </Dialog>
    );
}

// User Management Component
type User = {
    id: string;
    username: string;
    role: 'Admin' | 'Data Manager' | 'Salesman';
};

function UserManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = React.useState(0);
    
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore, refreshKey]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const handleUserChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        if (!firestore) return;
        try {
            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', userId);
            batch.update(userRef, { role: newRole });

            const adminRef = doc(firestore, 'admins', userId);
            if (newRole === 'Admin') {
                batch.set(adminRef, { uid: userId, isAdmin: true });
            } else {
                batch.delete(adminRef);
            }
            
            await batch.commit();

            toast({ title: "سەرکەوتوو بوو", description: "ڕۆڵی بەکارهێنەر نوێکرایەوە.", className: "bg-accent text-accent-foreground" });
        } catch (error) {
            console.error("Error updating role: ", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "نوێکردنەوەی ڕۆڵ سەرکەوتوو نەبوو." });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!firestore) return;
        try {
            const userRef = doc(firestore, 'users', userId);
            const adminRef = doc(firestore, 'admins', userId);

            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().role === 'Admin') {
                await deleteDoc(adminRef);
            }
            await deleteDoc(userRef);

            toast({ title: "بەکارهێنەر سڕایەوە", description: "بەکارهێنەرەکە بە سەرکەوتوویی سڕایەوە.", className: "bg-accent text-accent-foreground" });
            handleUserChange();
        } catch (error) {
            console.error("Error deleting user: ", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەی بەکارهێنەر سەرکەوتوو نەبوو." });
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>بەڕێوەبردنی بەکارهێنەران</CardTitle>
                    <CardDescription>ڕۆڵ و دەسەڵاتی بەکارهێنەرانی سیستەم بگۆڕە.</CardDescription>
                </div>
                <AddUserDialog onUserAdded={handleUserChange} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ئیمەیڵ (ناوی بەکارهێنەر)</TableHead>
                            <TableHead className="text-right w-[200px]">ڕۆڵ</TableHead>
                            <TableHead className="text-left w-[100px]">کردارەکان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : !users || users.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">هیچ بەکارهێنەرێک نییە.</TableCell></TableRow>
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
                                <TableCell className="text-left">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟</AlertDialogTitle>
                                                <AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">بەڵێ، بسڕەوە</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
    const { data: categories, isLoading, error } = useCollection<Category>(categoryQuery);
    
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
                        ) : error ? (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center text-destructive">Error: Could not load categories.</TableCell></TableRow>
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

const COLLECTIONS_TO_MANAGE = [
    'selling_forms', 
    'buying_forms', 
    'expenses', 
    'products', 
    'suppliers',
    'customers',
    'users',
    'product_categories',
    'expense_categories',
    'admins',
];

function DataManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const CONFIRMATION_TEXT = 'سڕینەوەی هەموو داتا';

    const exportAllData = async () => {
        if (!firestore) return;
        setIsExporting(true);
        toast({ title: "...چاوەڕوانبە", description: "هەناردەکردنی هەموو داتاکان." });

        const workbook = XLSX.utils.book_new();

        for (const collectionName of COLLECTIONS_TO_MANAGE) {
            try {
                const querySnapshot = await getDocs(collection(firestore, collectionName));
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // For nested collections
                if (collectionName === 'selling_forms' || collectionName === 'buying_forms') {
                    const nestedData = [];
                    for(const docSnap of querySnapshot.docs) {
                        const productsSnapshot = await getDocs(collection(firestore, `${collectionName}/${docSnap.id}/products`));
                        const products = productsSnapshot.docs.map(p => ({ [`${collectionName}_id`]: docSnap.id, ...p.data()}));
                        nestedData.push(...products);

                        if(collectionName === 'selling_forms') {
                            const paymentsSnapshot = await getDocs(collection(firestore, `${collectionName}/${docSnap.id}/payments`));
                            const payments = paymentsSnapshot.docs.map(p => ({ selling_form_id: docSnap.id, ...p.data()}));
                            
                            if (payments.length > 0) {
                                const ws = XLSX.utils.json_to_sheet(payments);
                                if (!workbook.Sheets['selling_form_payments']) {
                                    XLSX.utils.book_append_sheet(workbook, ws, 'selling_form_payments');
                                } else {
                                    XLSX.utils.sheet_add_json(workbook.Sheets['selling_form_payments'], payments, { origin: -1, skipHeader: true });
                                }
                            }
                        }
                    }
                    if (nestedData.length > 0) {
                         const ws = XLSX.utils.json_to_sheet(nestedData);
                         XLSX.utils.book_append_sheet(workbook, ws, `${collectionName}_products`);
                    }
                }
                
                const worksheet = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
            } catch (e) {
                console.warn(`Could not export ${collectionName}`, e);
            }
        }

        XLSX.writeFile(workbook, `Backup_All_Data.xlsx`);
        toast({ title: "سەرکەوتوو بوو", description: `هەموو داتاکان بەسەرکەوتوویی هەناردەکران.` });
        setIsExporting(false);
    }

    const deleteAllData = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        toast({ title: "...سڕینەوە", description: "تکایە چاوەڕوان بە.", variant: 'destructive' });

        try {
            const batch = writeBatch(firestore);

            for (const collectionName of COLLECTIONS_TO_MANAGE) {
                const querySnapshot = await getDocs(collection(firestore, collectionName));
                
                for (const docSnap of querySnapshot.docs) {
                    if (collectionName === 'selling_forms' || collectionName === 'buying_forms') {
                        const productsSnap = await getDocs(collection(firestore, `${collectionName}/${docSnap.id}/products`));
                        productsSnap.docs.forEach(p => batch.delete(p.ref));
                        
                        if (collectionName === 'selling_forms') {
                            const paymentsSnap = await getDocs(collection(firestore, `${collectionName}/${docSnap.id}/payments`));
                            paymentsSnap.docs.forEach(p => batch.delete(p.ref));
                        }
                    }
                    batch.delete(docSnap.ref);
                }
            }

            await batch.commit();
            toast({ title: "هەموو داتاکان سڕانەوە", description: "سیستەمەکە ئێستا بەتاڵە.", className: "bg-accent text-accent-foreground" });

        } catch (error) {
            console.error(`Failed to delete all data:`, error);
            toast({
                variant: 'destructive',
                title: `هەڵە لە سڕینەوەی داتاکان`,
                description: "هەوڵێکی تر بدەرەوە.",
            });
        } finally {
            setIsDeleting(false);
            setDeleteConfirmation('');
        }
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>بەڕێوەبردنی داتا</CardTitle>
                    <CardDescription>هەناردەکردنی هەموو داتاکان وەک یەک فایل.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={exportAllData} disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        هەناردەکردنی هەموو داتاکان
                    </Button>
                </CardContent>
            </Card>

             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">ناوچەی مەترسیدار</CardTitle>
                    <CardDescription>کردارەکانی ئێرە پاشگەزبوونەوەیان نییە. تکایە بە ئاگاییەوە بەکاریان بهێنە.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                سڕینەوەی هەموو داتا
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" /> ئایا دڵنیایت؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                   ئەم کردارە هەموو داتاکانی سیستەمەکە دەسڕێتەوە، لەوانە فرۆشەکان، کڕینەکان، خەرجییەکان، کاڵاکان و بەکارهێنەران. 
                                   <b className="text-destructive">ئەم کارە پاشگەزبوونەوەی نییە.</b>
                                   <br/><br/>
                                   بۆ بەردەوامبوون، تکایە ئەم دەستەواژەیە بنووسە: <b className="text-primary">{CONFIRMATION_TEXT}</b>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input 
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder={CONFIRMATION_TEXT}
                                className="mt-4"
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>پاشگەزبوونەوە</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={deleteAllData} 
                                    disabled={deleteConfirmation !== CONFIRMATION_TEXT || isDeleting}
                                    className="bg-destructive hover:bg-destructive/90">
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        تێگەیشتم، هەمووی بسڕەوە
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="ڕێکخستنەکانی سیستەم" description="بەڕێوەبردنی بەکارهێنەران، پۆلەکان، و داتاکان." />
            
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">گشتی</TabsTrigger>
                    <TabsTrigger value="users">بەکارهێنەران</TabsTrigger>
                    <TabsTrigger value="categories">پۆلەکان</TabsTrigger>
                    <TabsTrigger value="data">داتا</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-6">
                    <GeneralSettings />
                </TabsContent>
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
