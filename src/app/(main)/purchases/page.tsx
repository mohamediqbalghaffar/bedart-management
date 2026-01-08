import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, PlusCircle } from "lucide-react";

export default function PurchasesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="کڕینەکان" description="پسوولەکانی کڕین و دابینکەرەکانت بەڕێوەببە.">
                <div className="flex gap-2">
                     <Button variant="outline">
                        <Download />
                        هاوردەکردن لە ئێکسڵ
                    </Button>
                    <Button>
                        <PlusCircle />
                        پسوولەی کڕینی نوێ
                    </Button>
                </div>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا لیستی کڕینەکان پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
