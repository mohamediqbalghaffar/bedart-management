import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function SuppliersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="دابینکەران" description="لیستی دابینکەران و داتاکانیان بەڕێوەببە.">
                <Button>
                    <PlusCircle />
                    زیادکردنی دابینکەر
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا لیستی دابینکەران پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
