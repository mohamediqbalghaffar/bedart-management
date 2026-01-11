'use client';

import React from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Archive, AlertCircle, ShoppingCart } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { subDays, format, parseISO } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type SellingForm = {
    totalPrice: number;
    customerName: string;
    issueDate: string;
};

type Expense = {
    amount: number;
    paidBy: 'Cash - Dinar' | 'Cash - Dollar';
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
    
    const totalExpenses = React.useMemo(() => {
        if (!expenses) return 0;
        return expenses.reduce((acc, expense) => {
            if (expense.paidBy === 'Cash - Dinar') {
                return acc + (expense.amount / 1500);
            }
            return acc + expense.amount;
        }, 0);
    }, [expenses]);
    
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
            <StatCard title="کۆی گشتی فرۆش" value={currencyFormatter.format(totalRevenue)} icon={ShoppingCart} description="هەموو فرۆشە تۆمارکراوەکان" />
            <StatCard title="کۆی گشتی خەرجی" value={currencyFormatter.format(totalExpenses)} icon={DollarSign} description="هەموو خەرجییە تۆمارکراوەکان" />
            <StatCard title="کڕیارەکان" value={uniqueCustomers.toString()} icon={Users} description="کۆی ژمارەی کڕیارەکان" />
            <StatCard title="کاڵای کەم لە کۆگا" value={lowStockProducts.toString()} icon={Archive} description="کاڵاکان کە لە 5 دانە کەمتریان ماوە" isNegative={lowStockProducts > 0} />
        </div>
    );
}

const chartConfig = {
  sales: {
    label: "فرۆش",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

function RecentActivityChart() {
    const firestore = useFirestore();
    const salesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'selling_forms') : null, [firestore]);
    const { data: sales, isLoading } = useCollection<SellingForm>(salesQuery);

    const chartData = React.useMemo(() => {
        const last30Days = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
            const date = subDays(new Date(), i);
            last30Days.set(format(date, 'yyyy-MM-dd'), 0);
        }

        if (sales) {
            sales.forEach(sale => {
                const saleDate = format(parseISO(sale.issueDate), 'yyyy-MM-dd');
                if (last30Days.has(saleDate)) {
                    last30Days.set(saleDate, (last30Days.get(saleDate) || 0) + sale.totalPrice);
                }
            });
        }
        
        return Array.from(last30Days.entries()).map(([date, sales]) => ({
            date: format(parseISO(date), 'MMM d'),
            sales,
        }));
    }, [sales]);
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>چالاکییەکانی فرۆشتن (30 ڕۆژی ڕابردوو)</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-80 w-full">
                    <AreaChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <defs>
                            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="sales"
                            type="natural"
                            fill="url(#fillSales)"
                            fillOpacity={0.4}
                            stroke="hsl(var(--chart-1))"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
    return (
        <div className="p-4 md:p-8 space-y-8" dir="rtl">
            <PageHeader title="داشبۆرد" description="بەخێربێیتەوە بۆ سیستەمی بەڕێوەبردنی کارەکەت." />
            <DashboardStats />
            <RecentActivityChart />
        </div>
    );
}