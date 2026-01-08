
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
    label: "فرۆش",
    color: "hsl(var(--chart-1))",
  },
};

const unpaidSales: Omit<Sale, 'items'>[] = [];

const lowStockProducts: Product[] = [];

const topDebtCustomers: Customer[] = [];

const topSellingProducts: { id: string; name: string; sales: number }[] = [];

const initialChartData = [
  { month: "مانگی 1", total: 0 },
  { month: "مانگی 2", total: 0 },
  { month: "مانگی 3", total: 0 },
  { month: "مانگی 4", total: 0 },
  { month: "مانگی 5", total: 0 },
  { month: "مانگی 6", total: 0 },
];

export default function DashboardPage() {
  const [chartData, setChartData] = useState(initialChartData);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader title="داشبۆرد" description="پوختەیەک لە ئەدای کارەکەت.">
        <Button variant="outline">
          <FileDown />
          هەناردەکردنی ڕاپۆرت
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard title="کۆی فرۆش" value="$0" change="+0.0%" description="بەراورد بە مانگی پێشوو" />
        <StatCard title="کۆی کۆکراوە" value="$0" change="+0.0%" description="بەراورد بە مانگی پێشوو" />
        <StatCard title="قەرزە نەدراوەکان" value="$0" change="-0.0%" description="بەراورد بە مانگی پێشوو" isNegative />
        <StatCard title="کۆی خەرجییەکان" value="$0" change="+0.0%" description="بەراورد بە مانگی پێشوو" isNegative/>
        <StatCard title="قازانجی پوخت" value="$0" change="+0.0%" description="بەراورد بە مانگی پێشوو" />
        <StatCard title="نرخی کۆگا" value="$0" />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ئەدای فرۆش</CardTitle>
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
                <CardTitle>5 زۆرترین کڕیاری قەرزدار</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>کڕیار</TableHead>
                            <TableHead className="text-right">قەرز</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topDebtCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">هیچ کڕیارێک قەرزی لەسەر نییە.</TableCell>
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
            <CardTitle>فرۆشە نەدراوەکان</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کڕیار</TableHead>
                  <TableHead>بڕ</TableHead>
                  <TableHead>بارودۆخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {unpaidSales.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">هیچ فرۆشێکی نەدراو نییە.</TableCell>
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
            <CardTitle>کاڵا کەمەکان</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاڵا</TableHead>
                  <TableHead>دانەی ماوە</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">هەموو کاڵاکان لە کۆگان.</TableCell>
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
            <CardTitle className="flex items-center gap-2"><TrendingUp /> 5 پڕفرۆشترین کاڵا</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاڵا</TableHead>
                  <TableHead className="text-right">فرۆش</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {topSellingProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">هیچ داتایەکی فرۆش بەردەست نییە.</TableCell>
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
