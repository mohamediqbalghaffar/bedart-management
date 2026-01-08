import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, PlusCircle } from "lucide-react";

export default function PurchasesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="Purchases" description="Manage your purchase invoices and suppliers.">
                <div className="flex gap-2">
                     <Button variant="outline">
                        <Download />
                        Import from Excel
                    </Button>
                    <Button>
                        <PlusCircle />
                        New Purchase Invoice
                    </Button>
                </div>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>A list of purchases will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
