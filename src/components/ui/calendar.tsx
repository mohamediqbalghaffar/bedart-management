"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayModifiers, useNavigation, useDayPicker } from "react-day-picker"
import { format } from "date-fns";

import { cn } from "@/lib/utils"
import { buttonVariants } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function isSaturday(date: Date) {
  return date.getDay() === 6;
}

function isSunday(date: Date) {
  return date.getDay() === 0;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {

  const weekendModifier: DayModifiers = {
      saturday: isSaturday,
      sunday: isSunday
  };
  
  const allModifiers = { ...weekendModifier, ...props.modifiers };
  const isCkb = props.locale?.code === 'ckb';

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption_label: "hidden",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
            "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            "[&:has([aria-selected])]:bg-accent",
            isCkb ? "[&:has([aria-selected])]:last:rounded-l-md [&:has([aria-selected])]:first:rounded-r-md" : "[&:has([aria-selected])]:first:rounded-l-md [&:has([aria-selected])]:last:rounded-r-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-green-500 text-white rounded-full hover:bg-green-600 focus:bg-green-600",
        day_today: "bg-blue-200 text-blue-900 rounded-full",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiers={{
        ...allModifiers
      }}
      modifiersClassNames={{
        saturday: 'text-red-500',
        sunday: 'text-red-500'
      }}
      components={{
        Caption: ({ displayMonth }) => {
            const { goToMonth, nextMonth, previousMonth } = useNavigation();
            const { fromYear, toYear } = useDayPicker();
            
            const currentYear = new Date().getFullYear();
            const startYear = fromYear || currentYear - 10;
            const endYear = toYear || currentYear + 10;
            
            const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
            const months = Array.from({ length: 12 }, (_, i) => ({
                value: i,
                label: format(new Date(2000, i, 1), "MMMM", { locale: props.locale }),
            }));

            const handleYearChange = (value: string) => {
                const newDate = new Date(displayMonth);
                newDate.setFullYear(Number(value));
                goToMonth(newDate);
            };

            const handleMonthChange = (value: string) => {
                goToMonth(new Date(displayMonth.getFullYear(), Number(value), 1));
            };
            
            const prevButton = (
                 <button
                  type="button"
                  onClick={() => previousMonth && goToMonth(previousMonth)}
                  disabled={!previousMonth}
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-8 w-8")}
                >
                  {isCkb ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
            )
             const nextButton = (
                 <button
                  type="button"
                  onClick={() => nextMonth && goToMonth(nextMonth)}
                  disabled={!nextMonth}
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-8 w-8")}
                >
                  {isCkb ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            )

            return (
              <div className="flex justify-between items-center px-1 mb-2">
                {isCkb ? nextButton : prevButton}
                <div className="flex items-center gap-1">
                  <Select value={String(displayMonth.getMonth())} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[120px] h-8 text-sm focus:ring-ring">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={String(month.value)}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(displayMonth.getFullYear())} onValueChange={handleYearChange}>
                     <SelectTrigger className="w-[90px] h-8 text-sm focus:ring-ring">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                            {isCkb ? new Intl.NumberFormat('ar-EG').format(year) : year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isCkb ? prevButton : nextButton}
              </div>
            );
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
