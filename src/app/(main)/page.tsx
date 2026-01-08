"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, FileDown, Badge, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Customer, Product, Sale } from "@/lib/types";

const chartData = [
  { month: "January", total: Math.floor(Math.random() * 50000) + 10000 },
  { month: "February", total: Math.floor(Math.random() * 50000) + 10000 },
  { month: "March", total: Math.floor(Math.random() * 50000) + 10000 },
  { month: "April", total: Math.floor(Math.random() * 50000) + 10000 },
  { month: "May", total: Math.floor(Math.random() * 50000) + 10000 },
  { month: "June", total: Math.floor(Math.random() * 50000) + 10000 },
];

const chartConfig = {
  total: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
};

const unpaidSales: Omit<Sale, 'items'>[] = [
    { id: 'SALE001', customerName: 'Modern Furniture Co.', date: '2023-05-01', amount: 15000, status: 'Unpaid' },
    { id: 'SALE003', customerName: 'Dream Furnishings', date: '2023-05-10', amount: 22000, status: 'Unpaid' },
];

const lowStockProducts: Product[] = [
    { id: 'PROD002', name: 'Cotton Quilt Set', stock: 8, price: 450, lowStockThreshold: 10, category: 'Cover', location: 'Warehouse' },
    { id: 'PROD005', name: 'Medical Pillow', stock: 5, price: 250, lowStockThreshold: 5, category: 'Pillow', location: 'Shop Showroom' },
];

const topDebtCustomers: Customer[] = [
    { id: 'CUST002', name: 'Dream Furnishings', outstandingDebt: 22000 },
    { id: 'CUST001', name: 'Modern Furniture Co.', outstandingDebt: 15000 },
];

const topSellingProducts = [
    { id: 'PROD001', name: 'King Size Mattress', sales: 152 },
    { id: 'PROD003', name: 'Velvet Bed Frame', sales: 121 },
    { id: 'PROD002', name: 'Cotton Quilt Set', sales: 98 },
    { id: 'PROD004', name: 'Memory Foam Pillow', sales: 85 },
    { id: 'PROD005', name: 'Medical Pillow', sales: 72 },
];

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader title="Dashboard" description="An overview of your business performance.">
        <Button variant="outline">
          <FileDown />
          Export Report
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard title="Total Sales" value="$347,210" change="+12.5%" description="vs. last month" />
        <StatCard title="Total Collected" value="$272,150" change="+8.2%" description="vs. last month" />
        <StatCard title="Outstanding Debts" value="$75,060" change="-3.1%" description="vs. last month" isNegative />
        <StatCard title="Total Expenses" value="$42,500" change="+5.7%" description="vs. last month" isNegative/>
        <StatCard title="Net Profit" value="$229,650" change="+15.0%" description="vs. last month" />
        <StatCard title="Stock Value" value="$597,300" />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value / 1000}k`}
                   />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Debt Customers</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Debt</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topDebtCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell className="text-right text-destructive">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(customer.outstandingDebt)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Unpaid Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidSales.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sale.amount)}</TableCell>
                        <TableCell>
                            <Badge variant="destructive">{sale.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low-Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Remaining Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                            <Badge variant="destructive">{product.stock}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp /> Top 5 Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.sales}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
