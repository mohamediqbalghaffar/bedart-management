
'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, updateDoc, addDoc, deleteDoc, getDocs, writeBatch, getDoc, setDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, FileDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

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
                <CardDescription>ئەم زانیاریانە لەوانەیە لەسەر پسوولە و ڕاپۆرتەکان بەکاربێن.</CardDescription>
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
                    {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                    پاشەکەوتکردن
                </Button>
            </CardFooter>
        </Card>
    );
}


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
    'users',
    'product_categories',
    'expense_categories',
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

        for (const collectionName of COLLECTIONS_TO_MANAGE) {
            try {
                const querySnapshot = await getDocs(collection(firestore, collectionName));
                const batch = writeBatch(firestore);
                querySnapshot.docs.forEach(async (doc) => {
                    // Also delete subcollections if they exist
                    if (collectionName === 'selling_forms' || collectionName === 'buying_forms') {
                        const productsSnap = await getDocs(collection(firestore, `${collectionName}/${doc.id}/products`));
                        productsSnap.docs.forEach(p => batch.delete(p.ref));
                         if (collectionName === 'selling_forms') {
                             const paymentsSnap = await getDocs(collection(firestore, `${collectionName}/${doc.id}/payments`));
                             paymentsSnap.docs.forEach(p => batch.delete(p.ref));
                         }
                    }
                    batch.delete(doc.ref);
                });
                await batch.commit();
            } catch (error) {
                console.error(`Failed to delete collection ${collectionName}:`, error);
                toast({
                    variant: 'destructive',
                    title: `هەڵە لە سڕینەوەی ${collectionName}`,
                    description: "هەوڵێکی تر بدەرەوە.",
                });
                setIsDeleting(false);
                return;
            }
        }

        toast({ title: "هەموو داتاکان سڕانەوە", description: "سیستەمەکە ئێستا بەتاڵە.", className: "bg-accent text-accent-foreground" });
        setIsDeleting(false);
        setDeleteConfirmation('');
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>پاشەکەوتکردن و هەناردەکردن</CardTitle>
                    <CardDescription>هەموو داتاکانی سیستەم وەک یەک فایل پاشەکەوت بکە.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={exportAllData} disabled={isExporting}>
                        {isExporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileDown className="ml-2 h-4 w-4" />}
                        هەناردەکردنی هەموو داتا
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
                                <Trash2 className="ml-2 h-4 w-4" />
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
                                        {isDeleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
            <PageHeader title="ڕێکخستنەکان" description="بەڕێوەبردنی بەکارهێنەران، پۆلەکان، و داتاکانی سیستەم." />
            
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

    