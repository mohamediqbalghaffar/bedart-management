'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { useFirestore, collection, getDocs, query, where, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingCart, Archive, Package, LineChart, TrendingUp, TrendingDown, CalendarIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { format as formatDate, subDays, parseISO, isValid, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { ckb } from 'date-fns/locale/ckb';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WithId } from '@/firebase/firestore/use-collection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfidentialBlur } from '@/components/shared/confidential-blur';
import { Badge } from '@/components/ui/badge';

type SellingForm = { id: string; totalPrice: number; customerName: string; issueDate: string; creatorId: string; };
type Expense = { id: string; amount: number; date: string; name: string; currency?: 'USD' | 'IQD'; category: string; };
type Product = { id: string; currentQuantity: number; category: string; productName: string; sizeModel?: string; stockLocation: 'Warehouse' | 'Shop Showroom'; supplierId?: string; unitPrice?: number; sellingPrice?: number; };
type BuyingForm = { id: string; issueDate: string; supplierId: string; customsFee?: number; totalAmount?: number; };
type BuyingFormProduct = { quantity: number; unitPrice: number; productId: string; productName: string; category: string; };
type SellingFormProduct = { productId: string; productName: string; quantity: number; unitPrice: number; purchasePrice?: number; lineTotal: number; category: string; };
type Supplier = { id: string; supplierName: string; };

type GroupedProduct = {
    productName: string;
    category: string;
    sizeModel?: string;
    locations: { Warehouse?: WithId<Product>; 'Shop Showroom'?: WithId<Product>; };
    totalQuantity: number;
}

const productCategories = ["Mattress", "Bed", "Pillow", "Cover"];
const categoryTranslations: Record<string, string> = { Mattress: "دۆشەک", Bed: "تەخت", Pillow: "سەرین", Cover: "بەرگ" };

// A-01 & L-03: Cached formatters with ar-IQ locale
const formatUsd = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD' });
const formatUsdCompact = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short' });
const getCurrencyFormatter = (currency: string) => new Intl.NumberFormat('ar-IQ', { style: 'currency', currency });

const useDashboardData = (dateRange: { from: string, to: string }) => {
    const firestore = useFirestore();
    const [isProcessing, setIsProcessing] = useState(true);
    const [processingError, setProcessingError] = useState<Error | null>(null);

    const [stats, setStats] = useState({ totalRevenue: 0, totalExpensesAll: 0, netProfit: 0, buyingFormsCount: 0, lowStockCount: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [dialogData, setDialogData] = useState<any>({
        sales: { sales: [], perProduct: [], totalQuantity: 0, totalRevenue: 0, allSalesProducts: [] },
        expenses: [],
        purchases: { purchases: [], perProduct: [], totalQuantity: 0, totalCost: 0 },
        lowStockProducts: [],
    });
    
    const salesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'selling_forms'), where('issueDate', '>=', dateRange.from), where('issueDate', '<=', dateRange.to)) : null, [firestore, dateRange]);
    const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), where('date', '>=', dateRange.from), where('date', '<=', dateRange.to)) : null, [firestore, dateRange]);
    const buyingFormsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'buying_forms'), where('issueDate', '>=', dateRange.from), where('issueDate', '<=', dateRange.to)) : null, [firestore, dateRange]);
    const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products')) : null, [firestore]);
    const suppliersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'suppliers')) : null, [firestore]);
    
    const { data: salesData, isLoading: isLoadingSales, error: salesError } = useCollection<WithId<SellingForm>>(salesQuery);
    const { data: expensesData, isLoading: isLoadingExpenses, error: expensesError } = useCollection<WithId<Expense>>(expensesQuery);
    const { data: buyingFormsData, isLoading: isLoadingBuyingForms, error: buyingFormsError } = useCollection<WithId<BuyingForm>>(buyingFormsQuery);
    const { data: productsData, isLoading: isLoadingProducts, error: productsError } = useCollection<WithId<Product>>(productsQuery);
    const { data: suppliersData, isLoading: isLoadingSuppliers, error: suppliersError } = useCollection<WithId<Supplier>>(suppliersQuery);
    
    const isLoadingCollections = isLoadingSales || isLoadingExpenses || isLoadingBuyingForms || isLoadingProducts || isLoadingSuppliers;
    const collectionError = salesError || expensesError || buyingFormsError || productsError || suppliersError;

    useEffect(() => {
        let cancelled = false; // Race-condition guard: prevents stale async setState calls
        if (isLoadingCollections || collectionError || !firestore || !salesData || !expensesData || !buyingFormsData || !productsData || !suppliersData) {
            if (!isLoadingCollections) {
                 setIsProcessing(false);
            }
            return;
        }

        const processAllData = async () => {
            setIsProcessing(true);
            setProcessingError(null);
            try {
                const totalRevenue = salesData.reduce((acc, sale) => acc + sale.totalPrice, 0);

                // D-03: TODO — move this rate to Firestore 'app_settings/exchange_rates' document
                // and read it dynamically. Currently hardcoded; IQD/USD fluctuates daily.
                const iqdToUsdRate = 1500;
                const { totalUSD, totalIQD } = expensesData.reduce((acc, expense) => {
                    if (expense.currency === 'IQD') acc.totalIQD += expense.amount;
                    else acc.totalUSD += expense.amount;
                    return acc;
                }, { totalUSD: 0, totalIQD: 0 });

                // Operational expenses only (rent, salary, utilities, etc.) → USD
                const totalExpensesOperational = totalUSD + (totalIQD / iqdToUsdRate);
                // Purchase COGS — kept separate for transparency
                const totalPurchaseCost = buyingFormsData.reduce((acc, form) => acc + (form.totalAmount || 0), 0);
                
                // D-04: TODO — Fix N+1 Query Problem
                // Currently, this fetches EVERY subcollection for EVERY selling/buying form.
                // For production scalability, we MUST denormalize these totals into
                // a 'daily_aggregates' collection, or store 'totalProducts' and 'totalRevenue'
                // directly on the parent form document during the creation transaction.
                const salesProductsPromises = salesData.map(s => getDocs(collection(firestore, `selling_forms/${s.id}/selling_form_products`)));
                const buyingFormsProductsPromises = buyingFormsData.map(b => getDocs(collection(firestore, `buying_forms/${b.id}/buying_form_products`)));
                
                const salesProductsSnaps = await Promise.all(salesProductsPromises);
                const allSalesProducts = salesProductsSnaps.flatMap((snap, i) => snap.docs.map(doc => ({ formId: salesData[i].id, ...doc.data() as SellingFormProduct })));
                
                const buyingFormsProductsSnaps = await Promise.all(buyingFormsProductsPromises);
                const allBuyingFormsProducts = buyingFormsProductsSnaps.flatMap((snap, i) => snap.docs.map(doc => ({ formId: buyingFormsData[i].id, ...doc.data() as BuyingFormProduct })));

                // Calculate COGS (Cost of Goods Sold)
                const totalCOGS = allSalesProducts.reduce((acc, p) => acc + (p.quantity * (p.purchasePrice || 0)), 0);

                // Combined total costs shown on the expenses stat card (Cash Flow Out)
                const totalExpensesAll = totalExpensesOperational + totalPurchaseCost;
                // Net Profit = Revenue − Operational Expenses - COGS
                const netProfit = totalRevenue - totalExpensesOperational - totalCOGS;

                const groupedProductsMap = new Map<string, GroupedProduct>();
                productsData.forEach(p => {
                    const key = `${p.productName}-${p.sizeModel || ''}`;
                    if (!groupedProductsMap.has(key)) {
                        groupedProductsMap.set(key, { productName: p.productName, locations: {}, totalQuantity: 0, category: p.category, sizeModel: p.sizeModel });
                    }
                    const grouped = groupedProductsMap.get(key)!;
                    grouped.locations[p.stockLocation] = p;
                    grouped.totalQuantity += p.currentQuantity;
                });
                const groupedProducts = Array.from(groupedProductsMap.values());
                const lowStockCount = groupedProducts.filter(p => p.totalQuantity > 0 && p.totalQuantity < 5).length;
                
                if (!cancelled) setStats({ totalRevenue, totalExpensesAll, netProfit, buyingFormsCount: buyingFormsData.length, lowStockCount });

                const dateMap = new Map<string, { sales: number; expenses: number; netProfit: number }>();
                const startDate = startOfDay(parseISO(dateRange.from));
                const endDate = endOfDay(parseISO(dateRange.to));
                const days = differenceInDays(endDate, startDate);
                for (let i = days; i >= 0; i--) {
                    dateMap.set(formatDate(subDays(endDate, i), 'yyyy-MM-dd'), { sales: 0, expenses: 0, netProfit: 0 });
                }
                salesData.forEach(sale => {
                    const saleDate = formatDate(parseISO(sale.issueDate), 'yyyy-MM-dd');
                    if (dateMap.has(saleDate)) dateMap.get(saleDate)!.sales += sale.totalPrice;
                });

                expensesData.forEach(expense => {
                    const expenseDate = formatDate(parseISO(expense.date), 'yyyy-MM-dd');
                    if (dateMap.has(expenseDate)) {
                        let amountInUSD = expense.amount;
                        if (expense.currency === 'IQD') {
                            amountInUSD = expense.amount / iqdToUsdRate;
                        }
                        dateMap.get(expenseDate)!.expenses += amountInUSD;
                    }
                });

                buyingFormsData.forEach(purchase => {
                    const purchaseDate = formatDate(parseISO(purchase.issueDate), 'yyyy-MM-dd');
                    if(dateMap.has(purchaseDate)){
                        dateMap.get(purchaseDate)!.expenses += purchase.totalAmount || 0;
                    }
                });

                dateMap.forEach((data) => { data.netProfit = data.sales - data.expenses; });
                const finalChartData = Array.from(dateMap.entries()).map(([date, data]) => ({ date, ...data }));
                if (!cancelled) setChartData(finalChartData);


                const salesDialogSummary = allSalesProducts.reduce((acc, p) => {
                    acc.totalQuantity += p.quantity;
                    acc.totalRevenue += p.lineTotal;
                    const summary = acc.perProduct.get(p.productName) || { totalQuantity: 0, totalRevenue: 0 };
                    summary.totalQuantity += p.quantity;
                    summary.totalRevenue += p.lineTotal;
                    acc.perProduct.set(p.productName, summary);
                    return acc;
                }, { totalQuantity: 0, totalRevenue: 0, perProduct: new Map<string, { totalQuantity: number; totalRevenue: number }>() });
                
                const supplierMap = new Map(suppliersData.map(s => [s.id, s.supplierName]));
                const enrichedPurchases = buyingFormsData.map(p => ({ ...p, supplierName: supplierMap.get(p.supplierId) || 'نەزانراو' }));
                const purchasesDialogSummary = allBuyingFormsProducts.reduce((acc, p) => {
                    const lineCost = p.quantity * p.unitPrice;
                    acc.totalQuantity += p.quantity;
                    acc.totalCost += lineCost;
                    const summary = acc.perProduct.get(p.productName) || { totalQuantity: 0, totalCost: 0 };
                    summary.totalQuantity += p.quantity;
                    summary.totalCost += lineCost;
                    acc.perProduct.set(p.productName, summary);
                    return acc;
                }, { totalQuantity: 0, totalCost: 0, perProduct: new Map<string, { totalQuantity: number; totalCost: number }>() });

                if (!cancelled) setDialogData({
                    sales: {
                        sales: salesData,
                        perProduct: Array.from(salesDialogSummary.perProduct.entries()).map(([productName, data]) => ({ productName, ...data })),
                        totalQuantity: salesDialogSummary.totalQuantity,
                        totalRevenue: salesDialogSummary.totalRevenue,
                        allSalesProducts: allSalesProducts,
                    },
                    expenses: expensesData,
                    purchases: {
                        purchases: enrichedPurchases,
                        perProduct: Array.from(purchasesDialogSummary.perProduct.entries()).map(([productName, data]) => ({ productName, ...data })),
                        totalQuantity: purchasesDialogSummary.totalQuantity,
                        totalCost: purchasesDialogSummary.totalCost,
                    },
                    lowStockProducts: groupedProducts.filter(p => p.totalQuantity > 0 && p.totalQuantity < 5),
                });
            } catch (err: any) {
                if (!cancelled) setProcessingError(err);
            } finally {
                if (!cancelled) setIsProcessing(false);
            }
        };

        processAllData();
        // Cleanup: mark as cancelled so no stale setState calls fire after re-render
        return () => { cancelled = true; };
    }, [dateRange, firestore, salesData, expensesData, buyingFormsData, productsData, suppliersData, isLoadingCollections, collectionError]);

    return { isLoading: isLoadingCollections || isProcessing, error: collectionError || processingError, stats, chartData, dialogData };
};

function SalesDetailDialog({ data }: { data: any }) {
    const { sales, perProduct, totalQuantity, totalRevenue, allSalesProducts } = data;
    const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
    
    const filteredData = useMemo(() => {
        if (!sales) return { sales: [], perProduct: [], totalQuantity: 0, totalRevenue: 0 };

        if (categoryFilter === 'all') {
            return { sales, perProduct, totalQuantity, totalRevenue };
        }

        const filteredProducts = allSalesProducts.filter((p: any) => p.category === categoryFilter);
        const relevantFormIds = new Set(filteredProducts.map((p: any) => p.formId));
        const filteredSales = sales.filter((s: any) => relevantFormIds.has(s.id));
        
        const summary = filteredProducts.reduce((acc: any, p: any) => {
            acc.totalQuantity += p.quantity;
            acc.totalRevenue += p.lineTotal;
            const productSummary = acc.perProduct.get(p.productName) || { totalQuantity: 0, totalRevenue: 0 };
            productSummary.totalQuantity += p.quantity;
            productSummary.totalRevenue += p.lineTotal;
            acc.perProduct.set(p.productName, productSummary);
            return acc;
        }, { totalQuantity: 0, totalRevenue: 0, perProduct: new Map<string, { totalQuantity: number; totalRevenue: number }>() });
        
        return {
            sales: filteredSales,
            perProduct: Array.from(summary.perProduct.entries() as Iterable<[string, { totalQuantity: number; totalRevenue: number }]>).map(([productName, data]) => ({ productName, ...data })),
            totalQuantity: summary.totalQuantity,
            totalRevenue: summary.totalRevenue,
        }

    }, [data, categoryFilter, sales, perProduct, totalQuantity, totalRevenue, allSalesProducts]);


    return (
        <div className="max-h-[80vh] overflow-y-auto p-1">
             <Accordion type="multiple" defaultValue={['item-1']} className="w-full space-y-2">
                <AccordionItem value="item-1" className="border rounded-lg bg-card text-card-foreground">
                    <AccordionTrigger className="p-6 text-lg font-semibold">پوختەی گشتی</AccordionTrigger>
                    <AccordionContent className="p-6 pt-0 space-y-4">
                         <div className="w-full sm:w-1/2 md:w-1/3">
                            <Select dir="rtl" value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
                                <SelectTrigger><SelectValue placeholder="فلتەر بەپێی پۆل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">هەموو پۆلەکان</SelectItem>
                                    {productCategories.map(cat => <SelectItem key={cat} value={cat}>{categoryTranslations[cat]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">کۆی ژمارەی کاڵا فرۆشراوەکان</p>
                                <ConfidentialBlur><p className="text-2xl font-bold">{filteredData.totalQuantity}</p></ConfidentialBlur>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">کۆی داهاتی کاڵا فرۆشراوەکان</p>
                                <ConfidentialBlur><p className="text-2xl font-bold">{currencyFormatter.format(filteredData.totalRevenue)}</p></ConfidentialBlur>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg bg-card text-card-foreground">
                     <AccordionTrigger className="p-6 text-lg font-semibold">پوختەی هەر کاڵایەک</AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table className="hidden md:table">
                            <TableHeader><TableRow><TableHead className="text-right">ناوی کاڵا</TableHead><TableHead className="text-right">کۆی دانە</TableHead><TableHead className="text-right">کۆی داهات</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredData.perProduct.map((item: any) => ( <TableRow key={item.productName}><TableCell>{item.productName}</TableCell><TableCell><ConfidentialBlur>{item.totalQuantity}</ConfidentialBlur></TableCell><TableCell><ConfidentialBlur>{currencyFormatter.format(item.totalRevenue)}</ConfidentialBlur></TableCell></TableRow> ))}
                            </TableBody>
                        </Table>
                        <div className="space-y-4 md:hidden">
                            {filteredData.perProduct.map((item: any) => (
                                <Card key={item.productName}>
                                    <CardHeader><CardTitle>{item.productName}</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between"><span>کۆی دانە:</span><ConfidentialBlur><Badge variant="secondary">{item.totalQuantity}</Badge></ConfidentialBlur></div>
                                        <div className="flex justify-between"><span>کۆی داهات:</span><ConfidentialBlur><Badge>{currencyFormatter.format(item.totalRevenue)}</Badge></ConfidentialBlur></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3" className="border rounded-lg bg-card text-card-foreground">
                     <AccordionTrigger className="p-6 text-lg font-semibold">لیستی فرۆشتنەکان</AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table className="hidden md:table"><TableHeader><TableRow><TableHead className="text-right">کڕیار</TableHead><TableHead className="text-right">بەروار</TableHead><TableHead className="text-right">کۆی گشتی</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredData.sales?.map((sale: any) => ( <TableRow key={sale.id}><TableCell>{sale.customerName}</TableCell><TableCell>{formatDate(parseISO(sale.issueDate), 'dd/MM/yyyy')}</TableCell><TableCell><ConfidentialBlur>{currencyFormatter.format(sale.totalPrice)}</ConfidentialBlur></TableCell></TableRow> ))}
                            </TableBody>
                        </Table>
                        <div className="space-y-4 md:hidden">
                            {filteredData.sales?.map((sale: any) => (
                                <Card key={sale.id}>
                                    <CardHeader><CardTitle>{sale.customerName}</CardTitle><CardDescription>{formatDate(parseISO(sale.issueDate), 'dd/MM/yyyy')}</CardDescription></CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between"><span>کۆی گشتی:</span><ConfidentialBlur><Badge>{currencyFormatter.format(sale.totalPrice)}</Badge></ConfidentialBlur></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

function ExpensesDetailDialog({ expenses }: { expenses: WithId<Expense>[] | null }) {
    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <Table className="hidden md:table"><TableHeader><TableRow><TableHead className="text-right">خەرجی</TableHead><TableHead className="text-right">بەروار</TableHead><TableHead className="text-right">بڕ</TableHead></TableRow></TableHeader>
                <TableBody>
                    {expenses?.map(expense => ( <TableRow key={expense.id}><TableCell>{expense.name}</TableCell><TableCell>{formatDate(parseISO(expense.date), 'dd/MM/yyyy')}</TableCell><TableCell><ConfidentialBlur>{getCurrencyFormatter(expense.currency || 'USD').format(expense.amount)}</ConfidentialBlur></TableCell></TableRow> ))}
                </TableBody>
            </Table>
            <div className="space-y-4 md:hidden">
                {expenses?.map(expense => (
                    <Card key={expense.id}>
                        <CardHeader><CardTitle>{expense.name}</CardTitle><CardDescription>{formatDate(parseISO(expense.date), 'dd/MM/yyyy')}</CardDescription></CardHeader>
                        <CardContent>
                            <div className="flex justify-between"><span>بڕ:</span><ConfidentialBlur><Badge variant="destructive">{getCurrencyFormatter(expense.currency || 'USD').format(expense.amount)}</Badge></ConfidentialBlur></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function CombinedExpensesDetailDialog({ expenses, purchases }: { expenses: WithId<Expense>[] | null, purchases: any[] | null }) {
    return (
        <Tabs defaultValue="general" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">خەرجی گشتی</TabsTrigger>
                <TabsTrigger value="purchases">کڕینەکان</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
                <ExpensesDetailDialog expenses={expenses} />
            </TabsContent>
            <TabsContent value="purchases">
                 <div className="max-h-[60vh] overflow-y-auto">
                    <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">دابینکەر</TableHead>
                                <TableHead className="text-right">بەروار</TableHead>
                                <TableHead className="text-right">کۆی گشتی پسوولە</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases?.map((purchase: any) => (
                                <TableRow key={purchase.id}>
                                    <TableCell>{purchase.supplierName}</TableCell>
                                    <TableCell>{formatDate(parseISO(purchase.issueDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell><ConfidentialBlur>{formatUsd.format(purchase.totalAmount || 0)}</ConfidentialBlur></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="space-y-4 md:hidden">
                        {purchases?.map((purchase: any) => (
                             <Card key={purchase.id}>
                                <CardHeader><CardTitle>{purchase.supplierName}</CardTitle><CardDescription>{formatDate(parseISO(purchase.issueDate), 'dd/MM/yyyy')}</CardDescription></CardHeader>
                                <CardContent>
                                    <div className="flex justify-between"><span>کۆی گشتی:</span><ConfidentialBlur><Badge>{formatUsd.format(purchase.totalAmount || 0)}</Badge></ConfidentialBlur></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}


function PurchasesDetailDialog({ data }: { data: any }) {
    const { purchases, perProduct, totalQuantity, totalCost } = data;
    return (
        <div className="max-h-[80vh] overflow-y-auto p-1">
             <Accordion type="multiple" defaultValue={['item-1']} className="w-full space-y-2">
                <AccordionItem value="item-1" className="border rounded-lg bg-card text-card-foreground">
                    <AccordionTrigger className="p-6 text-lg font-semibold">پوختەی گشتی</AccordionTrigger>
                    <AccordionContent className="p-6 pt-0 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">کۆی ژمارەی کاڵا کڕاوەکان</p>
                                <ConfidentialBlur><p className="text-2xl font-bold">{totalQuantity}</p></ConfidentialBlur>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">کۆی نرخی کاڵا کڕاوەکان</p>
                                <ConfidentialBlur><p className="text-2xl font-bold">{formatUsd.format(totalCost)}</p></ConfidentialBlur>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border rounded-lg bg-card text-card-foreground">
                     <AccordionTrigger className="p-6 text-lg font-semibold">پوختەی هەر کاڵایەک</AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table className="hidden md:table"><TableHeader><TableRow><TableHead className="text-right">ناوی کاڵا</TableHead><TableHead className="text-right">کۆی دانە</TableHead><TableHead className="text-right">کۆی نرخ</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {perProduct.map((item: any) => ( <TableRow key={item.productName}><TableCell>{item.productName}</TableCell><TableCell><ConfidentialBlur>{item.totalQuantity}</ConfidentialBlur></TableCell><TableCell><ConfidentialBlur>{currencyFormatter.format(item.totalCost)}</ConfidentialBlur></TableCell></TableRow> ))}
                            </TableBody>
                        </Table>
                        <div className="space-y-4 md:hidden">
                            {perProduct.map((item: any) => (
                                <Card key={item.productName}>
                                    <CardHeader><CardTitle>{item.productName}</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between"><span>کۆی دانە:</span><ConfidentialBlur><Badge variant="secondary">{item.totalQuantity}</Badge></ConfidentialBlur></div>
                                        <div className="flex justify-between"><span>کۆی نرخ:</span><ConfidentialBlur><Badge>{currencyFormatter.format(item.totalCost)}</Badge></ConfidentialBlur></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3" className="border rounded-lg bg-card text-card-foreground">
                     <AccordionTrigger className="p-6 text-lg font-semibold">لیستی کڕینەکان</AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Table className="hidden md:table"><TableHeader><TableRow><TableHead className="text-right">دابینکەر</TableHead><TableHead className="text-right">بەروار</TableHead><TableHead className="text-right">کۆی گشتی پسوولە</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {purchases?.map((purchase: any) => ( <TableRow key={purchase.id}><TableCell>{purchase.supplierName}</TableCell><TableCell>{formatDate(parseISO(purchase.issueDate), 'dd/MM/yyyy')}</TableCell><TableCell><ConfidentialBlur>{currencyFormatter.format(purchase.totalAmount || 0)}</ConfidentialBlur></TableCell></TableRow> ))}
                            </TableBody>
                        </Table>
                        <div className="space-y-4 md:hidden">
                            {purchases?.map((purchase: any) => (
                                <Card key={purchase.id}>
                                    <CardHeader><CardTitle>{purchase.supplierName}</CardTitle><CardDescription>{formatDate(parseISO(purchase.issueDate), 'dd/MM/yyyy')}</CardDescription></CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between"><span>کۆی گشتی:</span><ConfidentialBlur><Badge>{formatUsd.format(purchase.totalAmount || 0)}</Badge></ConfidentialBlur></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

function LowStockDetailDialog({ products }: { products: GroupedProduct[] }) {
    const router = useRouter();
    const handleRowClick = (productName: string) => router.push(`/stock?search=${encodeURIComponent(productName)}`);

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <Table className="hidden md:table"><TableHeader><TableRow><TableHead className="text-right">ناوی کاڵا</TableHead><TableHead className="text-right">بڕی ماوە</TableHead></TableRow></TableHeader>
                <TableBody>
                    {products?.map(product => ( <TableRow key={product.productName} onClick={() => handleRowClick(product.productName)} className="cursor-pointer"><TableCell>{product.productName}</TableCell><TableCell><ConfidentialBlur>{product.totalQuantity}</ConfidentialBlur></TableCell></TableRow> ))}
                </TableBody>
            </Table>
            <div className="space-y-4 md:hidden">
                {products?.map(product => (
                    <Card key={product.productName} onClick={() => handleRowClick(product.productName)} className="cursor-pointer">
                        <CardHeader>
                            <CardTitle>{product.productName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between"><span>بڕی ماوە:</span><ConfidentialBlur><Badge variant="destructive">{product.totalQuantity}</Badge></ConfidentialBlur></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DashboardStats({ stats, dialogData }: { stats: any, dialogData: any }) {
    // Standard 2-decimal accounting format: $1,541,458.16
    const currencyFormatterDetailed = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {/* ── Total Sales ── */}
            <Dialog><DialogTrigger asChild><div className="cursor-pointer w-full"><StatCard title="کۆی فرۆش" value={<ConfidentialBlur>{formatUsd.format(stats.totalRevenue)}</ConfidentialBlur>} icon={ShoppingCart} description="کۆی گشتی فرۆشتن لە ماوەی دیاریکراودا." /></div></DialogTrigger>
                <DialogContent className="sm:max-w-4xl" dir="rtl"><DialogHeader><DialogTitle>وردەکاریی فرۆشتن</DialogTitle><DialogDescription>پوختەی فرۆشتنەکان لە ماوەی دیاریکراودا.</DialogDescription></DialogHeader><SalesDetailDialog data={dialogData.sales} /></DialogContent>
            </Dialog>

            {/* ── Total Expenses (operational + purchases) ── */}
            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer w-full">
                        <StatCard
                            title="کۆی خەرجی"
                            value={<ConfidentialBlur>{currencyFormatter.format(stats.totalExpensesAll)}</ConfidentialBlur>}
                            icon={DollarSign}
                            description="کۆی گشتی خەرجی و کڕینەکان بە دۆلار."
                        />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>وردەکاریی خەرجییەکان و کڕینەکان</DialogTitle>
                        <DialogDescription>لیستی خەرجییە گشتییەکان و پسوولەکانی کڕین لە ماوەی دیاریکراودا.</DialogDescription>
                    </DialogHeader>
                    <CombinedExpensesDetailDialog expenses={dialogData.expenses} purchases={dialogData.purchases.purchases} />
                </DialogContent>
            </Dialog>

            {/* ── Purchase Invoice Count ── */}
            <Dialog><DialogTrigger asChild><div className="cursor-pointer w-full"><StatCard title="ژمارەی پسوولەی کڕین" value={<ConfidentialBlur>{stats.buyingFormsCount.toString()}</ConfidentialBlur>} icon={Package} description="کۆی گشتی پسوولەی کڕین لە ماوەی دیاریکراودا." /></div></DialogTrigger>
                <DialogContent className="sm:max-w-4xl" dir="rtl"><DialogHeader><DialogTitle>وردەکاریی کڕینەکان</DialogTitle><DialogDescription>پوختەی کڕینەکان لە ماوەی دیاریکراودا.</DialogDescription></DialogHeader><PurchasesDetailDialog data={dialogData.purchases} /></DialogContent>
            </Dialog>

            {/* ── Low Stock ── */}
            <Dialog><DialogTrigger asChild><div className="cursor-pointer w-full"><StatCard title="کاڵای کەم لە کۆگا" value={<ConfidentialBlur>{stats.lowStockCount.toString()}</ConfidentialBlur>} icon={Archive} description="کاڵاکان کە بڕیان لەنێوان 1 بۆ 4 دانەیە" isNegative={stats.lowStockCount > 0} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-lg" dir="rtl"><DialogHeader><DialogTitle>کاڵا کەمبووەکان</DialogTitle><DialogDescription>لیستی ئەو کاڵایانەی کە بڕیان لەنێوان 1 بۆ 4 دانەیە.</DialogDescription></DialogHeader><LowStockDetailDialog products={dialogData.lowStockProducts} /></DialogContent>
            </Dialog>

            {/* ── Net Profit — full-width prominent KPI ── */}
            <div className="sm:col-span-2 lg:col-span-4">
                <StatCard
                    title="قازانجی پوخت"
                    value={<ConfidentialBlur>{currencyFormatter.format(stats.netProfit)}</ConfidentialBlur>}
                    icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown}
                    description="قازانج = کۆی فرۆش − تێچووی کاڵای فرۆشراو − خەرجییەکان"
                    isNegative={stats.netProfit < 0}
                />
            </div>
        </div>
    );
}

const chartConfig = { sales: { label: "فرۆش", color: "hsl(var(--chart-2))", icon: TrendingUp }, expenses: { label: "خەرجی", color: "hsl(var(--chart-5))", icon: TrendingDown }, netProfit: { label: "قازانجی پوخت", color: "hsl(var(--chart-1))", icon: LineChart } } satisfies ChartConfig;

function RecentActivityChart({ data }: { data: any[] }) {
    const [activeSubjects, setActiveSubjects] = useState({ sales: true, expenses: true, netProfit: true });
    const [viewMode, setViewMode] = useState<'daily' | 'total'>('daily');

    const totalData = useMemo(() => {
        if (viewMode !== 'total' || !data.length) return [];
        const totals = data.reduce((acc, curr) => {
            acc.sales += curr.sales;
            acc.expenses += curr.expenses;
            return acc;
        }, { sales: 0, expenses: 0 });
        const totalNetProfit = totals.sales - totals.expenses;
        return [
            { name: 'کۆی فرۆش', value: totals.sales, fill: 'var(--color-sales)' },
            { name: 'کۆی خەرجی', value: totals.expenses, fill: 'var(--color-expenses)' },
            { name: 'کۆی قازانج', value: totalNetProfit, fill: 'var(--color-netProfit)' },
        ];
    }, [data, viewMode]);

    // M-07: Use compact formatter

    return (
        <Card className="bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-indigo-900/50 text-white border-blue-800/50 w-full overflow-hidden">
            <CardHeader>
                <div className="flex flex-col gap-4">
                    <div><CardTitle className="text-white">نەخشەی چالاکییەکان</CardTitle><CardDescription className="text-white/80">بینینی فرۆشتن، خەرجی، و قازانج بەپێی ماوەی دیاریکراو.</CardDescription></div>
                </div>
                 <div className="flex flex-col items-center justify-end gap-4 mt-4 w-full" dir="rtl">
                    <Select dir="rtl" value={viewMode} onValueChange={(v) => setViewMode(v as any)}><SelectTrigger className="bg-white/10 text-white border-white/20 w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl"><SelectItem value="daily">نمایشی ڕۆژانە</SelectItem><SelectItem value="total">نمایشی گشتی</SelectItem></SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 sm:flex items-center gap-4 w-full justify-center">
                        {Object.entries(activeSubjects).map(([key, value]) => ( <div key={key} className="flex items-center space-x-2 space-x-reverse"><Checkbox id={key} checked={value} onCheckedChange={(checked) => setActiveSubjects(prev => ({...prev, [key]: !!checked}))} className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/><label htmlFor={key} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{chartConfig[key as keyof typeof chartConfig].label}</label></div> ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <ConfidentialBlur className='w-full block min-w-0'>
                {viewMode === 'daily' ? (
                <ChartContainer config={chartConfig} className="h-80 w-full min-w-0">
                    <AreaChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatDate(parseISO(value), 'MMM d')} tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}/>
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => formatUsdCompact.format(val)} tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}/>
                        <ChartTooltip cursor={true} content={<ChartTooltipContent labelFormatter={(label) => formatDate(parseISO(label), 'eeee, d MMMM yyyy')} indicator="dot" labelClassName="text-white" className="bg-card/80 backdrop-blur-sm text-white border-border/50" formatter={(value, name, item) => ( <div className="flex items-center gap-2"><div style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-full" /><div className="flex justify-between w-full"><span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig].label}: </span><span className="font-bold ml-2">{formatUsd.format(value as number)}</span></div></div> )}/>}/>
                        <defs><linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} /></linearGradient><linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} /></linearGradient><linearGradient id="fillNetProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-netProfit)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-netProfit)" stopOpacity={0.1} /></linearGradient></defs>
                        {activeSubjects.sales && <Area dataKey="sales" type="natural" fill="url(#fillSales)" stroke="var(--color-sales)" stackId="a" isAnimationActive animationDuration={700} animationEasing="ease-out" />}
                        {activeSubjects.expenses && <Area dataKey="expenses" type="natural" fill="url(#fillExpenses)" stroke="var(--color-expenses)" stackId="c" isAnimationActive animationDuration={900} animationEasing="ease-out" />}
                        {activeSubjects.netProfit && <Area dataKey="netProfit" type="natural" fill="url(#fillNetProfit)" stroke="var(--color-netProfit)" stackId="d" isAnimationActive animationDuration={1100} animationEasing="ease-out" />}
                    </AreaChart>
                </ChartContainer>
                ) : (
                 <ChartContainer config={chartConfig} className="h-80 w-full min-w-0">
                    <BarChart accessibilityLayer data={totalData.filter(d => activeSubjects[d.name.includes('فرۆش') ? 'sales' : d.name.includes('خەرجی') ? 'expenses' : 'netProfit'])}>
                         <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" /><XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value} tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => formatUsdCompact.format(val)} tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}/><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" labelClassName="text-white" className="bg-card/80 backdrop-blur-sm text-white border-border/50" />} /><Bar dataKey="value" radius={8} isAnimationActive animationDuration={800} animationEasing="ease-out" />
                    </BarChart>
                </ChartContainer>
                )}
                </ConfidentialBlur>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
    use(params);
    use(searchParams);
    const [dateRange, setDateRange] = useState<{ from: Date, to: Date }>({
        // L-08: Default to last 30 days instead of 2018 to prevent 2800-day chart
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date() 
    });

    const formattedDateRange = useMemo(() => ({
        from: formatDate(dateRange.from, 'yyyy-MM-dd'),
        to: formatDate(dateRange.to, 'yyyy-MM-dd'),
    }), [dateRange]);

    const { isLoading, error, stats, chartData, dialogData } = useDashboardData(formattedDateRange);

    if (error) {
        return <div className="text-destructive text-center p-8">هەڵەیەک ڕوویدا لە کاتی هێنانی داتاکان: {error.message}</div>
    }

    return (
        <div className="flex flex-col gap-6 md:gap-8 p-4 md:p-8 w-full max-w-full overflow-x-hidden" dir="rtl">
            <PageHeader title="داشبۆردی سەرەکی" description="پوختەی کارەکانت لێرە ببینە.">
                 {/* M-06: Stack vertically on mobile */}
                 <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">لە:</span>
                        <DatePicker
                            value={dateRange.from ? formatDate(dateRange.from, 'yyyy-MM-dd') : ""}
                            onChange={(val) => {
                                if (val) {
                                    const parsed = parseISO(val);
                                    if (isValid(parsed)) setDateRange(prev => ({...prev, from: parsed }));
                                }
                            }}
                            className="flex-1 min-w-0 bg-white/10 text-white border-white/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">بۆ:</span>
                        <DatePicker
                            value={dateRange.to ? formatDate(dateRange.to, 'yyyy-MM-dd') : ""}
                            onChange={(val) => {
                                if (val) {
                                    const parsed = parseISO(val);
                                    if (isValid(parsed)) setDateRange(prev => ({...prev, to: parsed }));
                                }
                            }}
                            className="flex-1 min-w-0 bg-white/10 text-white border-white/20"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() => setDateRange({ from: new Date('2018-01-01'), to: new Date() })}
                    >
                        هەموو ماوەکان
                    </Button>
                </div>
            </PageHeader>
            
            {isLoading ? (
                <div className="space-y-6 w-full">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => ( <Card key={i} className="bg-card/50 border-blue-800/40"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><div className="h-4 bg-muted rounded w-2/4" /></CardHeader><CardContent><div className="h-8 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-full" /></CardContent></Card> ))}
                    </div>
                    <Card className="h-96 flex items-center justify-center bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-indigo-900/50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></Card>
                </div>
            ) : (
                <div className="flex flex-col gap-6 md:gap-8 w-full">
                    <DashboardStats stats={stats} dialogData={dialogData} />
                    <RecentActivityChart data={chartData} />
                </div>
            )}
        </div>
    );
}
