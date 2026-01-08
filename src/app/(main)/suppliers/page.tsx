
'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddSupplierForm } from "./components/add-supplier-form";

export default function SuppliersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="دابینکەران" description="لیستی دابینکەران و داتاکانیان بەڕێوەببە.">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            زیادکردنی دابینکەر
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>دابینکەری نوێ زیاد بکە</DialogTitle>
                            <DialogDescription>
                                زانیارییەکانی دابینکەری نوێ بنووسە بۆ زیادکردنی بۆ سیستەم.
                            </DialogDescription>
                        </DialogHeader>
                        <AddSupplierForm />
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا لیستی دابینکەران پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
