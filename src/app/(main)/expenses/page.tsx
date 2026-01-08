import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function ExpensesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="Expenses" description="Track all business expenses, fixed and variable.">
                <Button>
                    <PlusCircle />
                    Add Expense
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>A list of expenses will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
