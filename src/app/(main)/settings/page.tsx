import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="Settings" description="Manage users, permissions, and system settings." />
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>Settings options will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
