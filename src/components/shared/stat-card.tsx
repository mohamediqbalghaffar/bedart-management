import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card className="bg-card/50 border-blue-800/40 text-white transition-all duration-300 hover:border-blue-600/60 hover:bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
            <Icon className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{value}</div>
            {description && <p className={cn("text-xs text-white/60", isNegative && "text-red-400")}>{description}</p>}
          </CardContent>
        </Card>
    )
}
