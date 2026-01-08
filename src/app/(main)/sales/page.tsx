import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Sale } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SalesForm } from "./components/sales-form";

const sales: Omit<Sale, 'items'>[] = [];

export default function SalesPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="فرۆشەکان" description="بەڕێوەبردن و بەدواداچوونی هەموو کارەکانی فرۆشتنت.">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle />
                            دروستکردنی فۆڕمی فرۆشتن
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <div className="text-center p-4">
                                <DialogTitle className="text-2xl font-bold">BedArt Group</DialogTitle>
                                <DialogDescription className="text-sm">
                                    ته ختی نوستن . دوشک . پشتی
                                    <br />
                                    <span className="text-xs text-muted-foreground">0770 817 1818 - 0770 077 1818</span>
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                        <div className="max-h-[80vh] overflow-y-auto p-2">
                          <SalesForm />
                        </div>
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>فرۆشەکانی ئەم دواییە</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>IDی پسوولە</TableHead>
                                <TableHead>کڕیار</TableHead>
                                <TableHead>بەروار</TableHead>
                                <TableHead>بڕ</TableHead>
                                <TableHead>بارودۆخ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">هیچ فرۆشێک تۆمار نەکراوە.</TableCell>
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
