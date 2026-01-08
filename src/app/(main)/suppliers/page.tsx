import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function SuppliersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="Suppliers" description="Manage your list of suppliers and their data.">
                <Button>
                    <PlusCircle />
                    Add Supplier
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>A list of suppliers will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
