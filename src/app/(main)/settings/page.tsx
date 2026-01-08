import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="ڕێکخستنەکان" description="بەڕێوەبردنی بەکارهێنەران، دەسەڵاتەکان، و ڕێکخستنەکانی سیستەم." />
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>لێرەدا بژاردەکانی ڕێکخستنەکان پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
