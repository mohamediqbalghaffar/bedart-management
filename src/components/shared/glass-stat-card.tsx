
import { MoreHorizontal, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type GlassStatCardProps = {
    title: string;
    value: string;
    change?: string;
    description?: string;
    isNegative?: boolean;
}

export function GlassStatCard({ title, value, description, isNegative = false }: GlassStatCardProps) {
    return (
        <div className="relative flex flex-col justify-between rounded-2xl p-6 text-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
            <div className="absolute top-0 left-0 w-full h-full bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10 flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">{title}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
            <div className="relative z-10">
                <h3 className="text-4xl font-bold">{value}</h3>
            </div>
            <div className="relative z-10">
                <p className="text-sm text-white/80">{description}</p>
            </div>
        </div>
    )
}
