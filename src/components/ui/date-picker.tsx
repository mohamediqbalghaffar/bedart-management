"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ckb } from "date-fns/locale/ckb"

export interface DatePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, className, placeholder = "بەروارێک هەڵبژێرە", disabled, ...props }, ref) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    
    // Fallback safe parsing
    let date: Date | undefined = undefined;
    if (value) {
      const parsed = parseISO(value);
      if (isValid(parsed)) date = parsed;
    }

    const handleSelect = (selectedDate: Date | undefined) => {
      if (selectedDate && onChange) {
        onChange(format(selectedDate, "yyyy-MM-dd"));
        setIsPopoverOpen(false);
      }
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-right font-normal rounded-xl h-10 px-3 border-slate-200 shadow-sm",
                !date && "text-slate-500"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="ml-2 h-4 w-4 flex-shrink-0" />
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {date ? format(date, "d MMMM yyyy", { locale: ckb }) : placeholder}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[auto] p-0 border-none bg-transparent shadow-none rounded-[1.5rem] mt-2 z-50" align="center" sideOffset={12}>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              locale={ckb}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"