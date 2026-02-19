'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase, collection, doc, getDoc, setDoc } from '@/firebase';
import { WithId } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileDown, AlertTriangle, PlusCircle, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogDescription, DialogTitle, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { AddUserForm } from './components/add-user-form';
import { EditableUserRow } from './components/editable-user-row';

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
    name: string;
    role: 'Admin' | 'Data Manager' | 'Salesman';
    code: string;
};

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
                <AddUserDialog onUserAdded={handleUserChange} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">ناو</TableHead>
                            <TableHead className="text-right">ڕۆڵ</TableHead>
                            <TableHead className="text-left">کردارەکان</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : !users || users.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">هیچ بەکارهێنەرێک نییە.</TableCell></TableRow>
                        ) : users?.map(user => (
                            <EditableUserRow key={user.id} user={user} onUserChanged={handleUserChange} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="ڕێکخستنەکانی سیستەم" description="بەڕێوەبردنی بەکارهێنەران، پۆلەکان، و داتاکان." />
            
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">گشتی</TabsTrigger>
                    <TabsTrigger value="users">بەکارهێنەران</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-6">
                    <GeneralSettings />
                </TabsContent>
                <TabsContent value="users" className="mt-6">
                    <UserManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
