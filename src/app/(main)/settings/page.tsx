'use client';

import React, { useState, useRef, use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, getDoc, setDoc, getDocs, deleteDoc, updateDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Loader2, FileDown, AlertTriangle, PlusCircle, FileUp, EyeOff, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { AddEditUserDialog } from './components/add-edit-user-dialog';
import { useConfidentialMode } from '@/contexts/confidential-mode-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { analyzeSqlExport } from '@/ai/flows/analyze-sql-export';


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
    const { isConfidential, toggleConfidentialMode } = useConfidentialMode();


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
                <CardTitle>زانیاری گشتی</CardTitle>
                <CardDescription>ڕێکخستنە گشتییەکانی سیستەمەکە.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">زانیاری کۆمپانیا</h3>
                    <div className="space-y-2">
                        <label htmlFor="companyName">ناوی کۆمپانیا</label>
                        <Input id="companyName" value={companyInfo.name} onChange={(e) => setCompanyInfo(p => ({...p, name: e.target.value}))} placeholder="BedArt Group" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="companyContact">زانیاری پەیوەندی</label>
                        <Textarea id="companyContact" value={companyInfo.contact} onChange={(e) => setCompanyInfo(p => ({...p, contact: e.target.value}))} placeholder="ژ. تەلەفۆن, ناونیشان, هتد" />
                    </div>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                     <h3 className="font-semibold">دۆخی نهێنی</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch id="confidential-mode" checked={isConfidential} onCheckedChange={toggleConfidentialMode} />
                        <Label htmlFor="confidential-mode" className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                           شاردنەوەی داتا هەستیارەکان (بۆ نمایشکردن)
                        </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        ئەم دۆخە هەموو ژمارە و داتا هەستیارەکان لە داشبۆرد و لاپەڕەکانی تردا دەشارێتەوە، بۆ ئەوەی بتوانیت سیستەمەکە بەبێ پیشاندانی زانیاری نهێنی نمایش بکەیت.
                    </p>
                 </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    پاشەکەوتکردنی زانیاری کۆمپانیا
                </Button>
            </CardFooter>
        </Card>
    );
}

type User = {
    id: string;
    name: string;
    role: 'Admin' | 'Data Manager' | 'Salesman';
    code: string;
    photoURL?: string;
};


function UserCard({ user, onUserChanged }: { user: WithId<User>, onUserChanged: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "users", user.id));
            toast({ title: "سەرکەوتوو بوو", description: "بەکارهێنەرەکە سڕایەوە.", className: "bg-accent text-accent-foreground" });
            onUserChanged();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "سڕینەوەکە سەرکەوتوو نەبوو." });
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const roleTranslations: Record<User['role'], string> = {
        'Admin': 'بەڕێوەبەر',
        'Data Manager': 'داتا مانجەر',
        'Salesman': 'فرۆشیار'
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                 <Avatar className="h-12 w-12">
                    <AvatarImage src={user.photoURL} alt={user.name} />
                    <AvatarFallback className="text-lg bg-secondary text-secondary-foreground">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{roleTranslations[user.role]}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="mt-auto flex justify-end gap-2">
                 <AddEditUserDialog user={user} onUserChanged={onUserChanged}>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4 text-blue-500" /></Button>
                </AddEditUserDialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" disabled={isDeleting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader><AlertDialogTitle>ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟</AlertDialogTitle><AlertDialogDescription>ئەم کردارە پاشگەزبوونەوەی نییە.</AlertDialogDescription></AlertDialogHeader>
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

function UserManagement() {
    const firestore = useFirestore();
    const [refreshKey, setRefreshKey] = React.useState(0);
    
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore, refreshKey]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const handleUserChange = () => {
        setRefreshKey(prev => prev + 1);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>بەڕێوەبردنی بەکارهێنەران</CardTitle>
                    <CardDescription>ڕۆڵ و دەسەڵاتی بەکارهێنەرانی سیستەم بگۆڕە.</CardDescription>
                </div>
                 <AddEditUserDialog onUserChanged={handleUserChange}>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />زیادکردنی بەکارهێنەر</Button>
                </AddEditUserDialog>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                ) : !users || users.length === 0 ? (
                    <div className="h-24 text-center text-muted-foreground flex items-center justify-center">هیچ بەکارهێنەرێک نییە.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {users?.map(user => (
                            <UserCard key={user.id} user={user} onUserChanged={handleUserChange} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


function DataManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const excelFileInputRef = useRef<HTMLInputElement>(null);
    const csvFileInputRef = useRef<HTMLInputElement>(null);

    const collectionsToBackup = ['customers', 'selling_forms', 'buying_forms', 'expenses', 'products', 'product_definitions', 'stock_movements', 'suppliers', 'users'];

    const exportAllData = async () => {
        if (!firestore) return;
        setIsExporting(true);
        toast({ title: '...هەناردەکردن', description: 'هەموو داتاکان خەریکی هەناردەکردنن' });

        try {
            const workbook = XLSX.utils.book_new();

            for (const collectionName of collectionsToBackup) {
                const querySnapshot = await getDocs(collection(firestore, collectionName));
                let data = querySnapshot.docs.map(doc => doc.data());

                if (collectionName === 'users') {
                    data = data.map(({ code, ...rest }) => rest);
                }

                if (data.length > 0) {
                    const worksheet = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
                }
            }

            const subcollectionMappings = [
                { parent: 'selling_forms', sub: 'selling_form_products', sheetPrefix: 'selling_products_' },
                { parent: 'selling_forms', sub: 'payments', sheetPrefix: 'selling_payments_' },
                { parent: 'buying_forms', sub: 'buying_form_products', sheetPrefix: 'buying_products_' },
            ];

            for (const mapping of subcollectionMappings) {
                const parentSnap = await getDocs(collection(firestore, mapping.parent));
                for (const formDoc of parentSnap.docs) {
                    const subSnap = await getDocs(collection(firestore, `${mapping.parent}/${formDoc.id}/${mapping.sub}`));
                    const subData = subSnap.docs.map(d => d.data());
                    if (subData.length > 0) {
                        const ws = XLSX.utils.json_to_sheet(subData);
                        XLSX.utils.book_append_sheet(workbook, ws, `${mapping.sheetPrefix}${formDoc.id}`);
                    }
                }
            }

            XLSX.writeFile(workbook, 'BedArt_Backup.xlsx');
            toast({ title: 'سەرکەوتوو بوو', description: 'هەموو داتاکان بە سەرکەوتوویی هەناردەکران.', className: 'bg-accent text-accent-foreground' });

        } catch (error) {
            console.error("Error exporting data: ", error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'هەناردەکردن سەرکەوتوو نەبوو.' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const downloadTemplate = () => {
        try {
            const workbook = XLSX.utils.book_new();
            const templateCollections = {
                products: [{ productName: "Sample Product", category: "Mattress", sizeModel: "King", stockLocation: "Warehouse", currentQuantity: 10, sellingPrice: 500, unitPrice: 300 }],
                customers: [{ customerName: "Sample Customer", customerPhoneNumber: "07701234567", customerAddress: "Suli" }],
                suppliers: [{ supplierName: "Sample Supplier", contactInformation: "07501234567" }],
                expenses: [{ name: "Sample Expense", date: new Date().toISOString().split('T')[0], amount: 100, currency: "USD", category: "Daily", note: "Misc" }],
            };
            
            for (const [sheetName, data] of Object.entries(templateCollections)) {
                const worksheet = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            }

            XLSX.writeFile(workbook, 'Import_Template.xlsx');
            toast({ title: 'سەرکەوتوو بوو', description: 'نموونەی فایل بە سەرکەوتوویی دابەزێنرا.', className: 'bg-accent text-accent-foreground' });
        } catch (error) {
             console.error("Template download error:", error);
             toast({ variant: 'destructive', title: "هەڵەیەک ڕوویدا", description: "دابەزاندنی نموونەکە سەرکەوتوو نەبوو." });
        }
    };
    
    const handleExcelFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !firestore) return;
        
        setIsImporting(true);
        toast({ title: '...هاوردەکردن', description: 'داتاکان خەریکی هاوردەکردنن' });

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                
                let changesCount = 0;
                for (const sheetName of workbook.SheetNames) {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    if (collectionsToBackup.includes(sheetName) && jsonData.length > 0) {
                        for (const row of jsonData as any[]) {
                            const docRef = doc(collection(firestore, sheetName));
                            let docData: any = { ...row, id: docRef.id };

                             if (sheetName === 'products' && row.productName && row.stockLocation) {
                                const productId = `${row.productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${row.stockLocation.toLowerCase().replace(/\s/g, '')}`;
                                const specificDocRef = doc(firestore, sheetName, productId);
                                docData = { ...row, id: productId };
                                await setDoc(specificDocRef, docData, { merge: true });
                            } else {
                                await setDoc(docRef, docData);
                            }
                            changesCount++;
                        }
                    }
                }
                toast({ title: 'سەرکەوتوو بوو', description: `${changesCount} تۆمار بە سەرکەوتوویی هاوردەکران.`, className: 'bg-accent text-accent-foreground' });
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Error importing data: ", error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'هاوردەکردن سەرکەوتوو نەبوو.' });
        } finally {
            setIsImporting(false);
            if (excelFileInputRef.current) {
                excelFileInputRef.current.value = "";
            }
        }
    };

    const handleCsvFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !firestore) return;
        
        setIsImporting(true);
        toast({ title: '...شیکردنەوەی فایل', description: 'AI خەریکی شیکردنەوەی داتاکانە.' });
        
        try {
            const csvData = await file.text();
            const result = await analyzeSqlExport({ csvData });
            
            let count = 0;
            const dataType = result.dataType;
            let records: any[] = [];

            if (dataType === 'products' && result.products) {
                records = result.products;
            } else if (dataType === 'customers' && result.customers) {
                records = result.customers;
            } else if (dataType === 'suppliers' && result.suppliers) {
                records = result.suppliers;
            } else {
                throw new Error("AI could not identify the data type or the data is empty.");
            }

            toast({ title: '...هاوردەکردن', description: `AI داتاکانی وەک ${dataType} ناساندەوە. خەریکی هاوردەکردنە.` });

            switch (dataType) {
                case 'products':
                    for (const record of records) {
                        const productName = record.productName;
                        const stockLocation = record.stockLocation || 'Warehouse';
                        if (productName && stockLocation) {
                            const productId = `${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${stockLocation.toLowerCase().replace(/\s/g, '')}`;
                            const docRef = doc(firestore, 'products', productId);
                            await setDoc(docRef, { ...record, stockLocation, id: productId }, { merge: true });
                            count++;
                        }
                    }
                    break;
                case 'customers':
                case 'suppliers':
                    for (const record of records) {
                        const docRef = doc(collection(firestore, dataType));
                        await setDoc(docRef, { ...record, id: docRef.id });
                        count++;
                    }
                    break;
            }
             toast({ title: 'سەرکەوتوو بوو', description: `${count} تۆماری نوێ لە جۆری ${dataType} بە سەرکەوتوویی زیادکرا.`, className: 'bg-accent text-accent-foreground' });

        } catch (error: any) {
            console.error("Error importing from CSV with AI:", error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: error.message || 'هاوردەکردن لە CSV سەرکەوتوو نەبوو.' });
        } finally {
             setIsImporting(false);
            if (csvFileInputRef.current) {
                csvFileInputRef.current.value = "";
            }
        }
    }

    const deleteAllData = async () => {
        if (!firestore) return;
        setIsDeleting(true);
        toast({ title: '...سڕینەوە', description: 'هەموو داتاکان خەریکی سڕینەوەن. تکایە چاوەڕوان بە.' });
        
        try {
            for (const collectionName of collectionsToBackup) {
                const querySnapshot = await getDocs(collection(firestore, collectionName));
                for (const docSnapshot of querySnapshot.docs) {
                    if (collectionName === 'selling_forms' || collectionName === 'buying_forms') {
                        const subcollections = ['selling_form_products', 'payments', 'buying_form_products'];
                        for (const sub of subcollections) {
                             if(sub.startsWith(collectionName.slice(0, -1))) {
                                const subSnap = await getDocs(collection(firestore, `${collectionName}/${docSnapshot.id}/${sub}`));
                                for (const subDoc of subSnap.docs) {
                                    await deleteDoc(subDoc.ref);
                                }
                             }
                        }
                    }
                    await deleteDoc(docSnapshot.ref);
                }
            }
            toast({ title: 'سەرکەوتوو بوو!', description: 'هەموو داتاکان سڕانەوە. تکایە لاپەڕەکە نوێ بکەرەوە.', className: 'bg-accent text-accent-foreground' });
        } catch (error) {
             console.error("Error deleting data: ", error);
            toast({ variant: 'destructive', title: 'هەڵەیەک ڕوویدا', description: 'سڕینەوەی داتاکان سەرکەوتوو نەبوو.' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>بەڕێوەبردنی داتا</CardTitle>
                <CardDescription>هەناردەکردنی، هاوردەکردنی، یان سڕینەوەی هەموو داتاکانی سیستەم.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
                 <Button variant="outline" onClick={exportAllData} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    هەناردەکردنی هەموو داتاکان
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                    <FileDown className="mr-2 h-4 w-4" />
                    دابەزاندنی نموونە (Excel)
                </Button>
                 <input
                    type="file"
                    ref={excelFileInputRef}
                    onChange={handleExcelFileUpload}
                    className="hidden"
                    accept=".xlsx, .xls"
                />
                <Button variant="outline" onClick={() => excelFileInputRef.current?.click()} disabled={isImporting}>
                     {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    هاوردەکردن لە Excel
                </Button>
                 <input
                    type="file"
                    ref={csvFileInputRef}
                    onChange={handleCsvFileUpload}
                    className="hidden"
                    accept=".csv"
                />
                 <Button variant="outline" onClick={() => csvFileInputRef.current?.click()} disabled={isImporting}>
                     {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    هاوردەکردن لە SQL (CSV)
                </Button>
            </CardContent>
            <CardFooter className="border-t border-destructive/20 pt-6 mt-6">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            سڕینەوەی هەموو داتاکان
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>ئاگاداربە! کردارێکی مەترسیدارە</AlertDialogTitle>
                            <AlertDialogDescription>
                               ئەم کردارە هەموو داتاکانی ناو سیستەمەکەت دەسڕێتەوە، وەک کاڵاکان، کڕیارەکان، فرۆشتنەکان و هەموو شتێکی تر. ئەم کارە پاشگەزبوونەوەی نییە.
                               <br/><br/>
                               ئایا دڵنیایت دەتەوێت بەردەوام بیت؟
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
                            <AlertDialogAction onClick={deleteAllData} className="bg-destructive hover:bg-destructive/90">
                                بەڵێ، هەمووی بسڕەوە
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}


export default function SettingsPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="ڕێکخستنەکانی سیستەم" description="بەڕێوەبردنی بەکارهێنەران، پۆلەکان، و داتاکان." />
            
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">گشتی</TabsTrigger>
                    <TabsTrigger value="users">بەکارهێنەران</TabsTrigger>
                    <TabsTrigger value="data">بەڕێوەبردنی داتا</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-6">
                    <GeneralSettings />
                </TabsContent>
                <TabsContent value="users" className="mt-6">
                    <UserManagement />
                </TabsContent>
                <TabsContent value="data" className="mt-6">
                    <DataManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
