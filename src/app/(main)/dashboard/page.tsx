
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { useFirestore, useCollection, useMemoFirebase, collection, getDocs as getDocsClient, collection as getCollectionClient } from '@/firebase';
import { where, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Archive, ShoppingCart, TrendingUp, TrendingDown, Package, LineChart } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { subDays, parseISO, isValid, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WithId } from '@/firebase/firestore/use-collection';

type SellingForm = {
    totalPrice: number;
    customerName: string;
    issueDate: string;
    creatorId: string;
};

type Expense = {
    amount: number;
    date: string;
};

type Product = {
    currentQuantity: number;
    category: string;
};

type BuyingForm = {
    id: string;
    issueDate: string;
    supplierId: string;
    customsFee?: number;
};

type BuyingFormProduct = {
    quantity: number;
    unitPrice: number;
    productId: string;
};

type SellingFormProduct = {
    productId: string;
}

type User = {
    username: string;
}

type Supplier = {
    supplierName: string;
}

type ProductCategory = {
    name: string;
}


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
        return expenses.reduce((acc, expense) => acc + expense.amount, 0);
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
  sales: { label: "فرۆش", color: "hsl(var(--chart-2))", icon: TrendingUp },
  purchases: { label: "کڕین", color: "hsl(var(--chart-3))", icon: Package },
  expenses: { label: "خەرجی", color: "hsl(var(--chart-5))", icon: TrendingDown },
  netProfit: { label: "قازانجی پوخت", color: "hsl(var(--chart-1))", icon: LineChart }
} satisfies ChartConfig

function RecentActivityChart() {
    const firestore = useFirestore();
    const [dateRange, setDateRange] = useState({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') });
    const [activeSubjects, setActiveSubjects] = useState({ sales: true, expenses: true, purchases: true, netProfit: true });
    const [viewMode, setViewMode] = useState<'daily' | 'total'>('daily');
    
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [supplierFilter, setSupplierFilter] = useState<string>('all');
    

    const [chartData, setChartData] = useState<any[]>([]);
    const [totalData, setTotalData] = useState<{ name: string; value: number; fill: string }[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // Data for filters
    const { data: productCategories } = useCollection<ProductCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'product_categories') : null, [firestore]));
    const { data: suppliers } = useCollection<Supplier>(useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]));
    

    useEffect(() => {
        async function calculateChartData() {
            const fromDate = parseISO(dateRange.from);
            const toDate = parseISO(dateRange.to);
            if (!isValid(fromDate) || !isValid(toDate) || !firestore) return;

            setIsCalculating(true);
            
            const startDate = startOfDay(fromDate);
            const endDate = endOfDay(toDate);

            // --- Build base queries ---
            let salesQuery = query(collection(firestore, 'selling_forms'), where('issueDate', '>=', dateRange.from), where('issueDate', '<=', dateRange.to));
            let purchasesQuery = query(collection(firestore, 'buying_forms'), where('issueDate', '>=', dateRange.from), where('issueDate', '<=', dateRange.to));
            let expensesQuery = query(collection(firestore, 'expenses'), where('date', '>=', dateRange.from), where('date', '<=', dateRange.to));
            
            // --- Apply filters ---
            
            if (supplierFilter !== 'all') {
                purchasesQuery = query(purchasesQuery, where('supplierId', '==', supplierFilter));
            }
            
            // --- Fetch initial data ---
            const [salesSnap, purchasesSnap, expensesSnap] = await Promise.all([ getDocsClient(salesQuery), getDocsClient(purchasesQuery), getDocsClient(expensesQuery) ]);
            let sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WithId<SellingForm>[];
            let purchases = purchasesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WithId<BuyingForm>[];
            const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WithId<Expense>[];

            // --- Category Filter (most complex) ---
            if (categoryFilter !== 'all') {
                const productIdsInCategory = new Set<string>();
                const productsInCategoryQuery = query(collection(firestore, 'products'), where('category', '==', categoryFilter));
                const productsSnap = await getDocsClient(productsInCategoryQuery);
                productsSnap.forEach(doc => productIdsInCategory.add(doc.id));

                const filterFormsByProductCategory = async (formCollection: string, forms: WithId<any>[]) => {
                    const filteredFormIds = new Set<string>();
                    for (const form of forms) {
                        const productsSnap = await getDocsClient(collection(firestore, `${formCollection}/${form.id}/products`));
                        for (const productDoc of productsSnap.docs) {
                            if (productIdsInCategory.has(productDoc.data().productId)) {
                                filteredFormIds.add(form.id);
                                break; 
                            }
                        }
                    }
                    return forms.filter(form => filteredFormIds.has(form.id));
                }
                sales = await filterFormsByProductCategory('selling_forms', sales);
                purchases = await filterFormsByProductCategory('buying_forms', purchases);
            }

            // --- Aggregate Data ---
            let totalSales = 0, totalPurchases = 0, totalExpenses = 0;
            const dateMap = new Map<string, { sales: number; expenses: number; purchases: number; netProfit: number }>();
            
            if (viewMode === 'daily') {
                const days = differenceInDays(endDate, startDate);
                for (let i = days; i >= 0; i--) {
                    const date = subDays(endDate, i);
                    dateMap.set(format(date, 'yyyy-MM-dd'), { sales: 0, expenses: 0, purchases: 0, netProfit: 0 });
                }
            }

            sales.forEach(sale => {
                totalSales += sale.totalPrice;
                if(viewMode === 'daily' && dateMap.has(sale.issueDate)) {
                    dateMap.get(sale.issueDate)!.sales += sale.totalPrice;
                }
            });
            expenses.forEach(expense => {
                totalExpenses += expense.amount;
                if(viewMode === 'daily' && dateMap.has(expense.date)) {
                    dateMap.get(expense.date)!.expenses += expense.amount;
                }
            });

            for (const purchase of purchases) {
                const productsSnap = await getDocsClient(getCollectionClient(firestore, `buying_forms/${purchase.id}/products`));
                const subTotal = productsSnap.docs.reduce((acc, doc) => acc + (doc.data().quantity * doc.data().unitPrice), 0);
                const totalAmount = subTotal + (purchase.customsFee || 0);
                totalPurchases += totalAmount;
                if(viewMode === 'daily' && dateMap.has(purchase.issueDate)) {
                    dateMap.get(purchase.issueDate)!.purchases += totalAmount;
                }
            }
            
            if (viewMode === 'daily') {
                dateMap.forEach((data) => {
                    data.netProfit = data.sales - data.expenses - data.purchases;
                });
                const finalData = Array.from(dateMap.entries()).map(([date, data]) => ({ date: format(parseISO(date), 'MMM d'), ...data }));
                setChartData(finalData);
            } else { // Total view
                const totalNetProfit = totalSales - totalExpenses - totalPurchases;
                setTotalData([
                    { name: 'کۆی فرۆش', value: totalSales, fill: 'var(--color-sales)' },
                    { name: 'کۆی کڕین', value: totalPurchases, fill: 'var(--color-purchases)' },
                    { name: 'کۆی خەرجی', value: totalExpenses, fill: 'var(--color-expenses)' },
                    { name: 'کۆی قازانج', value: totalNetProfit, fill: 'var(--color-netProfit)' },
                ]);
            }
            setIsCalculating(false);
        }

       calculateChartData();
    }, [dateRange, firestore, viewMode, categoryFilter, supplierFilter]);
    
    const currencyFormatter = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short' }).format(value);

    return (
        <Card className="bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-indigo-900/50 text-white border-blue-800/50">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-white">چالاکییەکان</CardTitle>
                        <CardDescription className="text-white/80">فرۆشتن، کڕین، خەرجی، و قازانج بەپێی ماوەی دیاریکراو</CardDescription>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Input type="text" value={dateRange.from} onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value }))} placeholder="YYYY-MM-DD" className="w-36 bg-white/10 text-white placeholder:text-white/50 border-white/20"/>
                            <span className="text-white/80">-</span>
                            <Input type="text" value={dateRange.to} onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value }))} placeholder="YYYY-MM-DD" className="w-36 bg-white/10 text-white placeholder:text-white/50 border-white/20"/>
                        </div>
                         <div className="grid grid-cols-2 sm:flex items-center gap-4">
                            {Object.entries(activeSubjects).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id={key} checked={value} onCheckedChange={(checked) => setActiveSubjects(prev => ({...prev, [key]: !!checked}))} className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
                                    <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{chartConfig[key as keyof typeof chartConfig].label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4" dir="rtl">
                    <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="daily">نمایشی ڕۆژانە</SelectItem><SelectItem value="total">نمایشی گشتی</SelectItem></SelectContent>
                    </Select>
                     <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20"><SelectValue placeholder="فلتەری پۆلی کاڵا" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">هەموو پۆلەکان</SelectItem>
                            {productCategories?.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20"><SelectValue placeholder="فلتەری دابینکەر" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">هەموو دابینکەران</SelectItem>
                            {suppliers?.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.supplierName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                 {isCalculating ? (
                    <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : viewMode === 'daily' ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                    <AreaChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value} tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}/>
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={currencyFormatter} tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}/>
                        <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="dot" labelClassName="text-white" className="bg-card/80 backdrop-blur-sm text-white border-border/50" formatter={(value, name, item) => (
                            <div className="flex items-center gap-2">
                                <div style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-full" />
                                <div className="flex justify-between w-full"><span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig].label}: </span><span className="font-bold ml-2">{currencyFormatter(value as number)}</span></div>
                            </div>
                        )}/>}/>
                        <defs>
                            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} /></linearGradient>
                            <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-purchases)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-purchases)" stopOpacity={0.1} /></linearGradient>
                            <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} /></linearGradient>
                            <linearGradient id="fillNetProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-netProfit)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-netProfit)" stopOpacity={0.1} /></linearGradient>
                        </defs>
                        {activeSubjects.sales && <Area dataKey="sales" type="natural" fill="url(#fillSales)" stroke="var(--color-sales)" stackId="a" />}
                        {activeSubjects.purchases && <Area dataKey="purchases" type="natural" fill="url(#fillPurchases)" stroke="var(--color-purchases)" stackId="b" />}
                        {activeSubjects.expenses && <Area dataKey="expenses" type="natural" fill="url(#fillExpenses)" stroke="var(--color-expenses)" stackId="c" />}
                        {activeSubjects.netProfit && <Area dataKey="netProfit" type="natural" fill="url(#fillNetProfit)" stroke="var(--color-netProfit)" stackId="d" />}
                    </AreaChart>
                </ChartContainer>
                ) : (
                 <ChartContainer config={chartConfig} className="h-80 w-full">
                    <BarChart accessibilityLayer data={totalData.filter(d => activeSubjects[d.name.includes('فرۆش') ? 'sales' : d.name.includes('کڕین') ? 'purchases' : d.name.includes('خەرجی') ? 'expenses' : 'netProfit'])}>
                         <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value}
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                        />
                         <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={currencyFormatter} tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}/>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" labelClassName="text-white" className="bg-card/80 backdrop-blur-sm text-white border-border/50" />}
                        />
                        <Bar dataKey="value" radius={8} />
                    </BarChart>
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

    

    