"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Badge, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from "recharts";
import type { Customer, Product, Sale } from "@/lib/types";
import { useEffect, useState } from "react";

const chartConfig = {
  total: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
};

const unpaidSales: Omit<Sale, 'items'>[] = [];

const lowStockProducts: Product[] = [];

const topDebtCustomers: Customer[] = [];

const topSellingProducts: { id: string; name: string; sales: number }[] = [];

const initialChartData = [
  { month: "January", total: 0 },
  { month: "February", total: 0 },
  { month: "March", total: 0 },
  { month: "April", total: 0 },
  { month: "May", total: 0 },
  { month: "June", total: 0 },
];

export default function DashboardPage() {
  const [chartData, setChartData] = useState(initialChartData);

  // You can fetch and update real data here in the future.
  // useEffect(() => {
  //   // Example of fetching data
  //   // fetch('/api/sales-data').then(res => res.json()).then(data => setChartData(data));
  // }, []);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader title="Dashboard" description="An overview of your business performance.">
        <Button variant="outline">
          <FileDown />
          Export Report
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard title="Total Sales" value="$0" change="+0.0%" description="vs. last month" />
        <StatCard title="Total Collected" value="$0" change="+0.0%" description="vs. last month" />
        <StatCard title="Outstanding Debts" value="$0" change="-0.0%" description="vs. last month" isNegative />
        <StatCard title="Total Expenses" value="$0" change="+0.0%" description="vs. last month" isNegative/>
        <StatCard title="Net Profit" value="$0" change="+0.0%" description="vs. last month" />
        <StatCard title="Stock Value" value="$0" />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
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
                    tickFormatter={(value) => `$${Number(value) / 1000}k`}
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
                        {topDebtCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">No customers with outstanding debt.</TableCell>
                            </TableRow>
                        ) : topDebtCustomers.map((customer) => (
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
                 {unpaidSales.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No unpaid sales.</TableCell>
                    </TableRow>
                ) : unpaidSales.map((sale) => (
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
                {lowStockProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">All products are in stock.</TableCell>
                    </TableRow>
                ) : lowStockProducts.map((product) => (
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
                 {topSellingProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">No sales data available.</TableCell>
                    </TableRow>
                ) : topSellingProducts.map((product) => (
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
