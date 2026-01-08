
'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { BuyingForm } from "./components/buying-form";

export default function PurchasesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="کڕینەکان" description="پسوولەکانی کڕین و دابینکەرەکانت بەڕێوەببە.">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            پسوولەی کڕینی نوێ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>تۆمارکردنی پسوولەی کڕین</DialogTitle>
                             <DialogDescription>
                                زانیارییەکانی پسوولەی کڕینی نوێ بنووسە.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto p-2">
                            <BuyingForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا لیستی کڕینەکان پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
