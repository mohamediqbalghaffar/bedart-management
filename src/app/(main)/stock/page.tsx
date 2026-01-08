import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function StockPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="Warehouse Management" description="Track stock levels and product value.">
                 <Button variant="outline">
                    <FileDown />
                    Export Report
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-6">
                     <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search for a product..." className="pl-10" />
                        </div>
                    </div>
                    <div className="p-8 text-center text-muted-foreground border rounded-lg">
                        <p>The product and stock levels table will be displayed here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
