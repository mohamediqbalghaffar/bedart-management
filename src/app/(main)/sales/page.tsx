import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Sale } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";

const sales: Omit<Sale, 'items'>[] = [];

export default function SalesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader title="Sales" description="Manage and track all your sales operations.">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            Create Sales Form
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>New Sales Form</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto p-1">
                          <SalesForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No sales recorded yet.</TableCell>
                                </TableRow>
                            ) : sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">{sale.id}</TableCell>
                                    <TableCell>{sale.customerName}</TableCell>
                                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sale.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={sale.status === 'Fully Paid' ? 'default' : sale.status === 'Unpaid' ? 'destructive' : 'secondary'} className={sale.status === 'Fully Paid' ? 'bg-accent text-accent-foreground' : ''}>
                                            {sale.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
