"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface DatePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, className, placeholder = "بەروارێک هەڵبژێرە", disabled, ...props }, ref) => {

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl h-10 px-3 border-slate-200 shadow-sm focus:ring-primary",
            !value && "text-slate-500"
          )}
        />
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"