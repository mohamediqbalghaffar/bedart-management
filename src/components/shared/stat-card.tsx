import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import React from 'react';

type StatCardProps = {
    title: string;
    value: string;
    icon: React.ElementType;
    description?: string;
    isNegative?: boolean;
}

export function StatCard({ title, value, icon: Icon, description, isNegative = false }: StatCardProps) {
    return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </CardContent>
        </Card>
    )
}
