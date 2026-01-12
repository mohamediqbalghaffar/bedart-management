
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { useFirestore, useCollection, useMemoFirebase, collection, getDocs as getDocsClient, collection as getCollectionClient } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Archive, ShoppingCart, TrendingUp, TrendingDown, Calendar as CalendarIcon, Package, LineChart } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { subDays, parseISO } from 'date-fns';
import { format } from 'date-fns-jalali';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
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

type BuyingForm = {
    id: string;
    issueDate: string;
    customsFee?: number;
};

type BuyingFormProduct = {
    quantity: number;
    unitPrice: number;
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 bg-muted rounded w-2/4" />
                        </CardHeader>
                        <CardContent>
                             <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                             <div className="h-3 bg-muted rounded w-full" />
                        </CardContent>
                    </Card>
                ))}
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
   purchases: {
    label: "کڕین",
    color: "hsl(var(--chart-3))",
    icon: Package,
  },
  expenses: {
    label: "خەرجی",
    color: "hsl(var(--chart-5))",
    icon: TrendingDown,
  },
  netProfit: {
    label: "قازانجی پوخت",
    color: "hsl(var(--chart-1))",
    icon: LineChart,
  }
} satisfies ChartConfig

function RecentActivityChart() {
    const firestore = useFirestore();
    const salesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'selling_forms') : null, [firestore]);
    const expensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
    const purchasesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'buying_forms') : null, [firestore]);

    const { data: sales, isLoading: salesLoading } = useCollection<SellingForm>(salesQuery);
    const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);
    const { data: purchases, isLoading: purchasesLoading } = useCollection<BuyingForm>(purchasesQuery);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    const [activeSubjects, setActiveSubjects] = useState({
        sales: true,
        expenses: true,
        purchases: false,
        netProfit: false,
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Helper function to get the number of days in a given range
    const differenceInDays = (dateLeft: Date, dateRight: Date): number => {
        const diffTime = Math.abs(dateLeft.getTime() - dateRight.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }


    useEffect(() => {
        async function calculateChartData() {
            if (!dateRange?.from || !firestore) return [];

            setIsCalculating(true);

            const dateMap = new Map<string, { sales: number; expenses: number; purchases: number; netProfit: number }>();
            const days = differenceInDays(dateRange.to ?? dateRange.from, dateRange.from);

            for (let i = days; i >= 0; i--) {
                const date = subDays(dateRange.to ?? dateRange.from, i);
                dateMap.set(format(date, 'yyyy-MM-dd'), { sales: 0, expenses: 0, purchases: 0, netProfit: 0 });
            }

            if (sales) {
                sales.forEach(sale => {
                    try {
                        const saleDate = format(parseISO(sale.issueDate), 'yyyy-MM-dd');
                        if (dateMap.has(saleDate)) {
                            dateMap.get(saleDate)!.sales += sale.totalPrice;
                        }
                    } catch (e) { console.warn("Invalid sale date format:", sale.issueDate); }
                });
            }
            
            if (expenses) {
                expenses.forEach(expense => {
                    try {
                        const expenseDate = format(parseISO(expense.date), 'yyyy-MM-dd');
                        if (dateMap.has(expenseDate)) {
                            const amountInUsd = expense.paidBy === 'Cash - Dinar' ? expense.amount / 1500 : expense.amount;
                            dateMap.get(expenseDate)!.expenses += amountInUsd;
                        }
                    } catch (e) { console.warn("Invalid expense date format:", expense.date); }
                });
            }

            if(purchases) {
                 for (const purchase of purchases) {
                    try {
                        const purchaseDate = format(parseISO(purchase.issueDate), 'yyyy-MM-dd');
                        if (dateMap.has(purchaseDate)) {
                            const productsColRef = getCollectionClient(firestore, `buying_forms/${purchase.id}/products`);
                            const productsSnapshot = await getDocsClient(productsColRef);
                            const subTotal = productsSnapshot.docs.reduce((acc, doc) => {
                                const item = doc.data() as BuyingFormProduct;
                                return acc + (item.quantity * item.unitPrice);
                            }, 0);
                            const totalAmount = subTotal + (purchase.customsFee || 0);
                            dateMap.get(purchaseDate)!.purchases += totalAmount;
                        }
                    } catch(e) { console.warn("Invalid purchase date format:", purchase.issueDate); }
                 }
            }

            dateMap.forEach((data, date) => {
                data.netProfit = data.sales - data.expenses - data.purchases;
            });
            
            const finalData = Array.from(dateMap.entries()).map(([date, data]) => ({
                date: format(parseISO(date), 'MMM d'),
                ...data,
            }));
            
            setChartData(finalData);
            setIsCalculating(false);
        }

       if(!salesLoading && !expensesLoading && !purchasesLoading) {
         calculateChartData();
       }
    }, [sales, expenses, purchases, dateRange, firestore, salesLoading, expensesLoading, purchasesLoading]);
    
    const isLoading = salesLoading || expensesLoading || purchasesLoading || isCalculating;
    
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
                        <CardDescription className="text-white/80">فرۆشتن، کڕین، خەرجی، و قازانج بەپێی ماوەی دیاریکراو</CardDescription>
                    </div>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[280px] justify-start text-left font-normal bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "d MMMM yyyy")} - {" "}
                                                {format(dateRange.to, "d MMMM, yyyy")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "d MMMM, yyyy")
                                        )
                                    ) : (
                                        <span>ماوەیەک هەڵبژێرە</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-background text-foreground" align="end" dir="rtl">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                         <div className="grid grid-cols-2 sm:flex items-center gap-4">
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
                            tickFormatter={(value) => currencyFormatter.format(value as number)}
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
                            <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-purchases)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-purchases)" stopOpacity={0.1} />
                            </linearGradient>
                             <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="fillNetProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-netProfit)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-netProfit)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        {activeSubjects.sales && <Area dataKey="sales" type="natural" fill="url(#fillSales)" stroke="var(--color-sales)" stackId="a" />}
                        {activeSubjects.purchases && <Area dataKey="purchases" type="natural" fill="url(#fillPurchases)" stroke="var(--color-purchases)" stackId="b" />}
                        {activeSubjects.expenses && <Area dataKey="expenses" type="natural" fill="url(#fillExpenses)" stroke="var(--color-expenses)" stackId="c" />}
                        {activeSubjects.netProfit && <Area dataKey="netProfit" type="natural" fill="url(#fillNetProfit)" stroke="var(--color-netProfit)" stackId="d" />}
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

    

    