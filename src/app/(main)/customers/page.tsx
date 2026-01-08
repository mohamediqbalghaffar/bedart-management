import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function CustomersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="کڕیارەکان" description="لیستی کڕیارەکان و مێژوویان بەڕێوەببە.">
                <Button>
                    <PlusCircle />
                    زیادکردنی کڕیار
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا لیستی کڕیارەکان پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
