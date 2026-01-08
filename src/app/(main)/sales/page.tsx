import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Sale } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";

const sales: Omit<Sale, 'items'>[] = [
    { id: 'SALE001', customerName: 'Modern Furniture Co.', date: '2023-05-01', amount: 15000, status: 'Unpaid' },
    { id: 'SALE002', customerName: 'The Comfort Hotel', date: '2023-05-05', amount: 35000, status: 'Fully Paid' },
    { id: 'SALE003', customerName: 'Dream Furnishings', date: '2023-05-10', amount: 22000, status: 'Unpaid' },
    { id: 'SALE004', customerName: 'Decor House', date: '2023-05-12', amount: 8000, status: 'Partially Paid' },
    { id: 'SALE005', customerName: 'Modern Building Est.', date: '2023-05-15', amount: 50000, status: 'Fully Paid' },
];

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
                            {sales.map((sale) => (
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
