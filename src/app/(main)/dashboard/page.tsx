
'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Archive, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';

type SellingForm = {
    totalPrice: number;
    customerName: string;
};

type Expense = {
    amount: number;
};

type Product = {
    currentQuantity: number;
};

function DashboardStats() {
    const firestore = useFirestore();

    const salesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'selling_forms') : null, [firestore]);
    const expensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
    const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);

    const { data: sales, isLoading: loadingSales } = useCollection<SellingForm>(salesQuery);
    const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQuery);
    const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

    const totalRevenue = React.useMemo(() => sales?.reduce((acc, sale) => acc + sale.totalPrice, 0) || 0, [sales]);
    const totalExpenses = React.useMemo(() => expenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0, [expenses]);
    
    const uniqueCustomers = React.useMemo(() => {
        if (!sales) return 0;
        const customerNames = new Set(sales.map(s => s.customerName));
        return customerNames.size;
    }, [sales]);

    const lowStockProducts = React.useMemo(() => {
        if (!products) return 0;
        return products.filter(p => p.currentQuantity < 5).length;
    }, [products]);

    const isLoading = loadingSales || loadingExpenses || loadingProducts;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="کۆی گشتی فرۆش" value={currencyFormatter.format(totalRevenue)} description="هەموو فرۆشە تۆمارکراوەکان" />
            <StatCard title="کۆی گشتی خەرجی" value={currencyFormatter.format(totalExpenses)} description="هەموو خەرجییە تۆمارکراوەکان" />
            <StatCard title="کڕیارەکان" value={uniqueCustomers.toString()} description="کۆی ژمارەی کڕیارەکان" />
            <StatCard title="کاڵای کەم لە کۆگا" value={lowStockProducts.toString()} description="کاڵاکان کە لە 5 دانە کەمتریان ماوە" isNegative={lowStockProducts > 0} />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="داشبۆرد" description="بەخێربێیتەوە بۆ سیستەمی بەڕێوەبردنی کارەکەت." />
            <DashboardStats />
             <Card>
                <CardHeader>
                    <CardTitle>چالاکییەکانی ئەم دواییە</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">لێرەدا لیستی چالاکییەکانی ئەم دواییە پیشان دەدرێت.</p>
                </CardContent>
            </Card>
        </div>
    );
}
