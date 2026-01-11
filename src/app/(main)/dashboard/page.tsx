'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { useFirestore, useCollection, useMemoFirebase, collection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Archive, ShoppingCart, TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';


type SellingForm = {
    totalPrice: number;
    customerName: string;
    issueDate: string;
};

type Expense = {
    amount: number;
    paidBy: 'Cash - Dinar' | 'Cash - Dollar';
    date: string;
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
    color: "hsl(var(--chart-2))",
    icon: TrendingUp,
  },
  expenses: {
    label: "خەرجی",
    color: "hsl(var(--chart-5))",
    icon: TrendingDown,
  },
} satisfies ChartConfig

function RecentActivityChart() {
    const firestore = useFirestore();
    const salesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'selling_forms') : null, [firestore]);
    const expensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
    const { data: sales, isLoading: salesLoading } = useCollection<SellingForm>(salesQuery);
    const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    const [activeSubjects, setActiveSubjects] = useState({
        sales: true,
        expenses: true,
    });

    const chartData = React.useMemo(() => {
        if (!dateRange?.from) return [];

        const dateMap = new Map<string, { sales: number; expenses: number }>();
        const days = differenceInDays(dateRange.to ?? dateRange.from, dateRange.from);

        for (let i = days; i >= 0; i--) {
            const date = subDays(dateRange.to ?? dateRange.from, i);
            dateMap.set(format(date, 'yyyy-MM-dd'), { sales: 0, expenses: 0 });
        }

        if (sales) {
            sales.forEach(sale => {
                try {
                    const saleDate = format(parseISO(sale.issueDate), 'yyyy-MM-dd');
                    if (dateMap.has(saleDate)) {
                        const dayData = dateMap.get(saleDate)!;
                        dayData.sales += sale.totalPrice;
                    }
                } catch (e) {
                    console.warn("Invalid sale date format:", sale.issueDate);
                }
            });
        }
        
        if (expenses) {
             expenses.forEach(expense => {
                try {
                    const expenseDate = format(parseISO(expense.date), 'yyyy-MM-dd');
                    if (dateMap.has(expenseDate)) {
                        const dayData = dateMap.get(expenseDate)!;
                        const amountInUsd = expense.paidBy === 'Cash - Dinar' ? expense.amount / 1500 : expense.amount;
                        dayData.expenses += amountInUsd;
                    }
                } catch (e) {
                     console.warn("Invalid expense date format:", expense.date);
                }
            });
        }
        
        return Array.from(dateMap.entries()).map(([date, data]) => ({
            date: format(parseISO(date), 'MMM d'),
            ...data,
        }));
    }, [sales, expenses, dateRange]);
    
    const isLoading = salesLoading || expensesLoading;
    
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short'
    });

    return (
        <Card className="bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-indigo-900/50 text-white border-blue-800/50">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-white">چالاکییەکان</CardTitle>
                        <CardDescription className="text-white/80">فرۆشتن و خەرجی بەپێی ماوەی دیاریکراو</CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[280px] justify-start text-left font-normal bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>ماوەیەک هەڵبژێرە</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                         <div className="flex items-center gap-4">
                            {Object.entries(activeSubjects).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox
                                        id={key}
                                        checked={value}
                                        onCheckedChange={(checked) => setActiveSubjects(prev => ({...prev, [key]: !!checked}))}
                                        className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {chartConfig[key as keyof typeof chartConfig].label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-80">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                    <AreaChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                             tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => currencyFormatter.format(value)}
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                        />
                        <ChartTooltip
                            cursor={true}
                            content={<ChartTooltipContent
                                indicator="dot"
                                labelClassName="text-white"
                                className="bg-card/80 backdrop-blur-sm text-white border-border/50" 
                                formatter={(value, name, item) => (
                                    <div className="flex items-center gap-2">
                                        <div style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-full" />
                                        <div className="flex justify-between w-full">
                                            <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig].label}: </span>
                                            <span className="font-bold ml-2">{currencyFormatter.format(value as number)}</span>
                                        </div>
                                    </div>
                                )}
                            />}
                        />
                        <defs>
                            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                            </linearGradient>
                             <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        {activeSubjects.sales && <Area
                            dataKey="sales"
                            type="natural"
                            fill="url(#fillSales)"
                            stroke="var(--color-sales)"
                            stackId="a"
                        />}
                       {activeSubjects.expenses && <Area
                            dataKey="expenses"
                            type="natural"
                            fill="url(#fillExpenses)"
                            stroke="var(--color-expenses)"
                            stackId="b"
                        />}
                    </AreaChart>
                </ChartContainer>
                )}
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
