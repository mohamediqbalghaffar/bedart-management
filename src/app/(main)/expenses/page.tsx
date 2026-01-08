import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function ExpensesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="خەرجییەکان" description="بەدواداچوون بۆ هەموو خەرجییەکانی کارەکەت بکە، جێگیر و گۆڕاو.">
                <Button>
                    <PlusCircle />
                    زیادکردنی خەرجی
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا لیستی خەرجییەکان پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
